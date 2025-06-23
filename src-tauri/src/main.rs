use libc;
use once_cell::sync::Lazy;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::fs;
use std::fs::OpenOptions;
use std::os::unix::io::AsRawFd;
use std::path::{Component, Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::command;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FsEntry {
    name: String,
    path: String,
    is_dir: bool,
}

const KERNEL_QUERY_HEAP_USAGE: u32 = 1;
const KERNEL_QUERY_SCHED_STATS: u32 = 2;
const KERNEL_QUERY_AI_HEAP_USAGE: u32 = 3;
const KERNEL_QUERY_NEXT_DEVICE_EVENT: u32 = 4;

#[repr(C)]
#[derive(Default, Clone)]
struct KernelQueryRequest {
    query: u32,
    nonce: u32,
    signature: u32,
}

#[repr(C)]
#[derive(Default, Clone)]
struct KernelQueryResponse {
    result: u64,
}

#[repr(C)]
#[derive(Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceEvent {
    added: bool,
    bus: u8,
    slot: u8,
    func: u8,
    vendor_id: u16,
    device_id: u16,
    class_code: u8,
    subclass: u8,
}

#[repr(C)]
#[derive(Default, Clone)]
struct IDevice {
    bus: u8,
    slot: u8,
    func: u8,
    vendor_id: u16,
    device_id: u16,
    class_code: u8,
    subclass: u8,
}

#[repr(C)]
#[derive(Default, Clone)]
struct KernelDeviceEvent {
    added: u8,
    dev: IDevice,
}

#[repr(C)]
#[derive(Default, Clone)]
struct QueryIoc {
    req: KernelQueryRequest,
    res: KernelQueryResponse,
    event: KernelDeviceEvent,
}

static OFFLINE: Lazy<AtomicBool> = Lazy::new(|| AtomicBool::new(false));

fn init_offline_state() {
    let locations = ["/EFI/PHILLOS/offline.cfg", "storage/offline.cfg"];
    for p in locations {
        if let Ok(data) = fs::read_to_string(p) {
            if data.trim().eq_ignore_ascii_case("1")
                || data.trim().eq_ignore_ascii_case("true")
                || data.trim().eq_ignore_ascii_case("on")
            {
                OFFLINE.store(true, Ordering::Relaxed);
                break;
            }
        }
    }
}

fn sign_token(nonce: u32, query: u32) -> u32 {
    let mut hash = 0x5a17c3e4u32 ^ nonce ^ query;
    hash ^= 0x811C9DC5;
    hash = hash.wrapping_mul(0x01000193);
    hash
}

const IOC_NRBITS: libc::c_ulong = 8;
const IOC_TYPEBITS: libc::c_ulong = 8;
const IOC_SIZEBITS: libc::c_ulong = 14;
const IOC_DIRBITS: libc::c_ulong = 2;

const IOC_NRSHIFT: libc::c_ulong = 0;
const IOC_TYPESHIFT: libc::c_ulong = IOC_NRSHIFT + IOC_NRBITS;
const IOC_SIZESHIFT: libc::c_ulong = IOC_TYPESHIFT + IOC_TYPEBITS;
const IOC_DIRSHIFT: libc::c_ulong = IOC_SIZESHIFT + IOC_SIZEBITS;

const IOC_WRITE: libc::c_ulong = 1;
const IOC_READ: libc::c_ulong = 2;

const fn ioc(
    dir: libc::c_ulong,
    t: libc::c_ulong,
    nr: libc::c_ulong,
    size: libc::c_ulong,
) -> libc::c_ulong {
    (dir << IOC_DIRSHIFT) | (t << IOC_TYPESHIFT) | (nr << IOC_NRSHIFT) | (size << IOC_SIZESHIFT)
}

const fn iowr(t: libc::c_ulong, nr: libc::c_ulong, size: libc::c_ulong) -> libc::c_ulong {
    ioc(IOC_READ | IOC_WRITE, t, nr, size)
}

const QUERY_IOCTL: libc::c_ulong = iowr(
    'p' as libc::c_ulong,
    1,
    std::mem::size_of::<QueryIoc>() as libc::c_ulong,
);

fn normalize_path<P: AsRef<Path>>(path: P) -> PathBuf {
    let mut result = PathBuf::new();
    for comp in path.as_ref().components() {
        match comp {
            Component::ParentDir => {
                result.pop();
            }
            Component::CurDir => {}
            other => result.push(other.as_os_str()),
        }
    }
    result
}

fn ensure_safe_path(p: &str) -> Result<PathBuf, String> {
    if p.contains('\0') {
        return Err("invalid path".into());
    }
    let base_env = std::env::var("PHILLOS_STORAGE_DIR").unwrap_or_else(|_| "storage".into());
    let mut base = PathBuf::from(base_env);
    if base.is_relative() {
        base = std::env::current_dir()
            .map_err(|e| e.to_string())?
            .join(base);
    }
    base = normalize_path(base);

    let mut path = PathBuf::from(p);
    if !path.is_absolute() {
        path = base.join(path);
    }
    path = normalize_path(path);

    if path.starts_with(&base) {
        Ok(path)
    } else {
        Err("path outside allowed directory".into())
    }
}

#[command]
fn list_dir(path: String) -> Result<Vec<FsEntry>, String> {
    let path = ensure_safe_path(&path)?;
    let mut entries = Vec::new();
    if path.is_dir() {
        for entry in fs::read_dir(&path).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let file_type = entry.file_type().map_err(|e| e.to_string())?;
            entries.push(FsEntry {
                name: entry.file_name().to_string_lossy().into(),
                path: entry.path().to_string_lossy().into(),
                is_dir: file_type.is_dir(),
            });
        }
    }
    Ok(entries)
}

#[command]
fn copy_file(src: String, dest: String) -> Result<(), String> {
    let src = ensure_safe_path(&src)?;
    let dest = ensure_safe_path(&dest)?;
    fs::copy(src, dest).map(|_| ()).map_err(|e| e.to_string())
}

#[command]
fn move_file(src: String, dest: String) -> Result<(), String> {
    let src = ensure_safe_path(&src)?;
    let dest = ensure_safe_path(&dest)?;
    fs::rename(src, dest).map_err(|e| e.to_string())
}

#[command]
fn delete_file(path: String) -> Result<(), String> {
    let path = ensure_safe_path(&path)?;
    if fs::metadata(&path).map_err(|e| e.to_string())?.is_dir() {
        fs::remove_dir_all(&path).map_err(|e| e.to_string())
    } else {
        fs::remove_file(&path).map_err(|e| e.to_string())
    }
}

#[command]
fn archive_file(path: String) -> Result<(), String> {
    let src = ensure_safe_path(&path)?;
    let archive_env = std::env::var("PHILLOS_ARCHIVE_DIR").unwrap_or_else(|_| "archive".into());
    let mut dest_dir = PathBuf::from(archive_env);
    if dest_dir.is_relative() {
        dest_dir = std::env::current_dir()
            .map_err(|e| e.to_string())?
            .join(dest_dir);
    }
    dest_dir = normalize_path(dest_dir);
    fs::create_dir_all(&dest_dir).map_err(|e| e.to_string())?;
    let name = Path::new(&src).file_name().ok_or("invalid path")?;
    let dest = dest_dir.join(name);
    fs::rename(src, dest).map_err(|e| e.to_string())
}

#[command]
fn prefetch_files(paths: Vec<String>) -> Result<(), String> {
    let cache_env = std::env::var("PHILLOS_CACHE_DIR").unwrap_or_else(|_| "cache".into());
    let mut cache_dir = PathBuf::from(cache_env);
    if cache_dir.is_relative() {
        cache_dir = std::env::current_dir()
            .map_err(|e| e.to_string())?
            .join(cache_dir);
    }
    cache_dir = normalize_path(cache_dir);
    fs::create_dir_all(&cache_dir).map_err(|e| e.to_string())?;
    for p in paths {
        let src = ensure_safe_path(&p)?;
        if let Some(name) = Path::new(&src).file_name() {
            let dest = cache_dir.join(name);
            let _ = fs::copy(src, dest);
        }
    }
    Ok(())
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalendarEvent {
    id: i64,
    title: String,
    start: String,
    end: String,
    tasks: Option<String>,
}

fn open_conn() -> Result<Connection, rusqlite::Error> {
    let base = std::env::var("PHILLOS_STORAGE_DIR").unwrap_or_else(|_| "storage".into());
    let mut dir = PathBuf::from(base);
    if dir.is_relative() {
        if let Ok(cwd) = std::env::current_dir() {
            dir = cwd.join(dir);
        }
    }
    std::fs::create_dir_all(&dir).map_err(|_| rusqlite::Error::InvalidPath(dir.clone()))?;
    let db_path = dir.join("events.db");
    Connection::open(db_path)
}

fn init_db(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, start TEXT, end TEXT, tasks TEXT)",
        [],
    )?;
    Ok(())
}

#[command]
fn save_event(event: CalendarEvent) -> Result<i64, String> {
    let conn = open_conn().map_err(|e| e.to_string())?;
    init_db(&conn).map_err(|e| e.to_string())?;
    if event.id == 0 {
        conn.execute(
            "INSERT INTO events (title,start,end,tasks) VALUES (?,?,?,?)",
            params![event.title, event.start, event.end, event.tasks],
        )
        .map_err(|e| e.to_string())?;
        Ok(conn.last_insert_rowid())
    } else {
        conn.execute(
            "UPDATE events SET title=?, start=?, end=?, tasks=? WHERE id=?",
            params![event.title, event.start, event.end, event.tasks, event.id],
        )
        .map_err(|e| e.to_string())?;
        Ok(event.id)
    }
}

#[command]
fn load_events() -> Result<Vec<CalendarEvent>, String> {
    let conn = open_conn().map_err(|e| e.to_string())?;
    init_db(&conn).map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id,title,start,end,tasks FROM events")
        .map_err(|e| e.to_string())?;
    let iter = stmt
        .query_map([], |row| {
            Ok(CalendarEvent {
                id: row.get(0)?,
                title: row.get(1)?,
                start: row.get(2)?,
                end: row.get(3)?,
                tasks: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for ev in iter {
        out.push(ev.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

#[command]
fn call_scheduler(action: String, payload: String) -> Result<String, String> {
    let output = Command::new("python3")
        .arg("services/timeai_scheduler.py")
        .arg(action)
        .arg(payload)
        .output()
        .map_err(|e| e.to_string())?;
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).into())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).into())
    }
}

#[command]
fn smart_tags(path: String) -> Result<Vec<String>, String> {
    let path = ensure_safe_path(&path)?;
    let output = Command::new("node")
        .arg("services/tagger.js")
        .arg(path.to_string_lossy().to_string())
        .output()
        .map_err(|e| e.to_string())?;
    if output.status.success() {
        let out = String::from_utf8_lossy(&output.stdout);
        serde_json::from_str::<Vec<String>>(&out).map_err(|e| e.to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).into())
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SchedStats {
    task_count: u32,
    last_residual: f32,
}

#[command]
fn query_scheduler() -> Result<SchedStats, String> {
    let mut ioc = QueryIoc::default();
    ioc.req.query = KERNEL_QUERY_SCHED_STATS;
    ioc.req.nonce = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as u32;
    ioc.req.signature = sign_token(ioc.req.nonce, ioc.req.query);
    let file = OpenOptions::new()
        .read(true)
        .write(true)
        .open("/dev/phillos-query")
        .map_err(|e| e.to_string())?;
    let ret = unsafe { libc::ioctl(file.as_raw_fd(), QUERY_IOCTL, &mut ioc) };
    if ret < 0 {
        return Err("ioctl failed".into());
    }
    let count = (ioc.res.result & 0xFFFF_FFFF) as u32;
    let bits = (ioc.res.result >> 32) as u32;
    let residual = f32::from_bits(bits);
    Ok(SchedStats {
        task_count: count,
        last_residual: residual,
    })
}

#[command]
fn next_device_event() -> Result<Option<DeviceEvent>, String> {
    let mut ioc = QueryIoc::default();
    ioc.req.query = KERNEL_QUERY_NEXT_DEVICE_EVENT;
    ioc.req.nonce = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as u32;
    ioc.req.signature = sign_token(ioc.req.nonce, ioc.req.query);
    let file = OpenOptions::new()
        .read(true)
        .write(true)
        .open("/dev/phillos-query")
        .map_err(|e| e.to_string())?;
    let ret = unsafe { libc::ioctl(file.as_raw_fd(), QUERY_IOCTL, &mut ioc) };
    if ret < 0 {
        return Err("ioctl failed".into());
    }
    if ioc.res.result == 0 {
        return Ok(None);
    }
    Ok(Some(DeviceEvent {
        added: ioc.event.added != 0,
        bus: ioc.event.dev.bus,
        slot: ioc.event.dev.slot,
        func: ioc.event.dev.func,
        vendor_id: ioc.event.dev.vendor_id,
        device_id: ioc.event.dev.device_id,
        class_code: ioc.event.dev.class_code,
        subclass: ioc.event.dev.subclass,
    }))
}

#[command]
fn offline_state() -> bool {
    OFFLINE.load(Ordering::Relaxed)
}

#[cfg(not(test))]
fn main() {
    init_offline_state();
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            list_dir,
            copy_file,
            move_file,
            delete_file,
            archive_file,
            prefetch_files,
            save_event,
            load_events,
            call_scheduler,
            smart_tags,
            query_scheduler,
            next_device_event,
            offline_state
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests;

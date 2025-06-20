use std::fs;
use std::path::{Path, PathBuf, Component};
use std::process::Command;
use tauri::command;
use serde::{Serialize, Deserialize};
use rusqlite::{params, Connection};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FsEntry {
    name: String,
    path: String,
    is_dir: bool,
}

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
        base = std::env::current_dir().map_err(|e| e.to_string())?.join(base);
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
    Connection::open("events.db")
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
        .arg(path.to_string_lossy().into())
        .output()
        .map_err(|e| e.to_string())?;
    if output.status.success() {
        let out = String::from_utf8_lossy(&output.stdout);
        serde_json::from_str::<Vec<String>>(&out).map_err(|e| e.to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).into())
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            list_dir,
            copy_file,
            move_file,
            save_event,
            load_events,
            call_scheduler,
            smart_tags
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn list_dir_returns_entries() {
        let dir = tempdir().unwrap();
        std::env::set_var("PHILLOS_STORAGE_DIR", dir.path());
        std::fs::write(dir.path().join("a.txt"), b"hi").unwrap();
        std::fs::create_dir(dir.path().join("sub")).unwrap();

        let mut entries = list_dir(".".into()).unwrap();
        entries.sort_by(|a, b| a.name.cmp(&b.name));
        assert_eq!(entries.len(), 2);
        assert!(entries.iter().any(|e| e.is_dir));
    }

    #[test]
    fn copy_file_works() {
        let dir = tempdir().unwrap();
        std::env::set_var("PHILLOS_STORAGE_DIR", dir.path());
        let src = dir.path().join("src.txt");
        let dest = dir.path().join("dst.txt");
        std::fs::write(&src, b"hi").unwrap();
        copy_file("src.txt".into(), "dst.txt".into()).unwrap();
        assert!(dest.exists());
    }

    #[test]
    fn rejects_outside_paths() {
        let dir = tempdir().unwrap();
        let base = dir.path().join("base");
        std::fs::create_dir(&base).unwrap();
        std::env::set_var("PHILLOS_STORAGE_DIR", &base);

        let outside_dir = dir.path().join("outside");
        std::fs::create_dir(&outside_dir).unwrap();
        std::fs::write(outside_dir.join("a.txt"), b"hi").unwrap();

        assert!(list_dir(outside_dir.to_string_lossy().into()).is_err());
        assert!(copy_file(outside_dir.join("a.txt").to_string_lossy().into(), "b.txt".into()).is_err());
        assert!(move_file("b.txt".into(), outside_dir.join("c.txt").to_string_lossy().into()).is_err());
        assert!(smart_tags(outside_dir.join("a.txt").to_string_lossy().into()).is_err());
    }
}

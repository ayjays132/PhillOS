use std::fs;
use std::path::PathBuf;
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

#[command]
fn list_dir(path: String) -> Result<Vec<FsEntry>, String> {
    let path = PathBuf::from(path);
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
    fs::copy(src, dest).map(|_| ()).map_err(|e| e.to_string())
}

#[command]
fn move_file(src: String, dest: String) -> Result<(), String> {
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

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            list_dir,
            copy_file,
            move_file,
            save_event,
            load_events,
            call_scheduler
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

use std::fs;
use std::path::{Path, PathBuf};
use tauri::command;
use serde::Serialize;

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

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![list_dir, copy_file, move_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

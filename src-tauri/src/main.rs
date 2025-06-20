use std::fs;
use std::path::{Path, PathBuf};
use once_cell::sync::Lazy;
use std::sync::Mutex;
use gstreamer as gst;
use gstreamer_app as gst_app;
use tauri::command;
use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FsEntry {
    name: String,
    path: String,
    is_dir: bool,
}

static PLAYLIST_FILE: &str = "playlists.json";
static PIPELINE: Lazy<Mutex<Option<gst::Pipeline>>> = Lazy::new(|| Mutex::new(None));

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

#[command]
fn list_media() -> Result<Vec<FsEntry>, String> {
    let path = PathBuf::from("media");
    if !path.exists() {
        return Ok(Vec::new());
    }
    let mut entries = Vec::new();
    for entry in fs::read_dir(&path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let file_type = entry.file_type().map_err(|e| e.to_string())?;
        entries.push(FsEntry {
            name: entry.file_name().to_string_lossy().into(),
            path: entry.path().to_string_lossy().into(),
            is_dir: file_type.is_dir(),
        });
    }
    Ok(entries)
}

#[command]
fn get_playlists() -> Result<serde_json::Value, String> {
    let data = fs::read_to_string(PLAYLIST_FILE).unwrap_or_else(|_| "{}".into());
    serde_json::from_str(&data).map_err(|e| e.to_string())
}

#[command]
fn save_playlist(name: String) -> Result<(), String> {
    let mut json: serde_json::Value = get_playlists().unwrap_or_default();
    json[name.clone()] = serde_json::json!([]);
    fs::write(PLAYLIST_FILE, serde_json::to_string(&json).unwrap()).map_err(|e| e.to_string())
}

#[command]
fn delete_playlist(name: String) -> Result<(), String> {
    let mut json: serde_json::Value = get_playlists().unwrap_or_default();
    json.as_object_mut().map(|o| o.remove(&name));
    fs::write(PLAYLIST_FILE, serde_json::to_string(&json).unwrap()).map_err(|e| e.to_string())
}

#[command]
fn play_media(path: String) -> Result<(), String> {
    gst::init().map_err(|e| e.to_string())?;
    let uri = gst::Uri::from_file_path(path).map_err(|_| "invalid path")?;
    let pipeline = gst::parse_launch(&format!("playbin uri={}", uri))
        .map_err(|e| e.to_string())?
        .downcast::<gst::Pipeline>()
        .map_err(|_| "pipeline")?;
    pipeline
        .set_state(gst::State::Playing)
        .map_err(|e| format!("{:?}", e))?;
    *PIPELINE.lock().unwrap() = Some(pipeline);
    Ok(())
}

#[command]
fn detect_scenes(path: String) -> Result<Vec<f64>, String> {
    gst::init().map_err(|e| e.to_string())?;
    let uri = gst::Uri::from_file_path(path).map_err(|_| "invalid path")?;
    let pipeline = gst::parse_launch(&format!(
        "uridecodebin uri={} ! videoconvert ! appsink name=sink",
        uri
    ))
    .map_err(|e| e.to_string())?
    .downcast::<gst::Pipeline>()
    .map_err(|_| "pipeline")?;
    let sink = pipeline
        .by_name("sink")
        .ok_or("no sink")?
        .downcast::<gst_app::AppSink>()
        .map_err(|_| "sink cast")?;
    sink.set_property("emit-signals", &true).unwrap();
    let mut last: Option<Vec<u8>> = None;
    let mut times = vec![];
    pipeline.set_state(gst::State::Playing).map_err(|e| format!("{:?}", e))?;
    while let Ok(sample) = sink.pull_sample() {
        let buffer = sample.buffer().ok_or("buf")?;
        let map = buffer.map_readable().map_err(|e| e.to_string())?;
        let data = map.as_slice();
        if let Some(ref prev) = last {
            let diff = data
                .iter()
                .zip(prev.iter())
                .filter(|(a, b)| a != b)
                .count() as f64
                / data.len() as f64;
            if diff > 0.3 {
                if let Some(ts) = buffer.pts() {
                    times.push(ts.seconds().unwrap_or(0) as f64);
                }
            }
        }
        last = Some(data.to_vec());
    }
    pipeline.set_state(gst::State::Null).ok();
    Ok(times)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            list_dir,
            copy_file,
            move_file,
            list_media,
            get_playlists,
            save_playlist,
            delete_playlist,
            play_media,
            detect_scenes,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

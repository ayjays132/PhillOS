// Additional tests for file operations and kernel queries

use super::*;
use tempfile::tempdir;
use once_cell::sync::Lazy;
use std::sync::Mutex;

static TEST_MUTEX: Lazy<Mutex<()>> = Lazy::new(|| Mutex::new(()));

// mock ioctl for query_scheduler and next_device_event
static mut IOCTL_RESP: Option<QueryIoc> = None;

#[no_mangle]
unsafe extern "C" fn ioctl(_fd: libc::c_int, _req: libc::c_ulong, argp: *mut QueryIoc) -> libc::c_int {
    if let Some(ref mut resp) = IOCTL_RESP {
        *argp = resp.clone();
        0
    } else {
        -1
    }
}

#[test]
fn move_file_invalid_path() {
    let _guard = TEST_MUTEX.lock().unwrap();
    let dir = tempdir().unwrap();
    std::env::set_var("PHILLOS_STORAGE_DIR", dir.path());
    let err = move_file("../a".into(), "b".into()).unwrap_err();
    assert!(err.contains("outside"));
}

#[test]
fn delete_file_invalid_path() {
    let _guard = TEST_MUTEX.lock().unwrap();
    let dir = tempdir().unwrap();
    std::env::set_var("PHILLOS_STORAGE_DIR", dir.path());
    let err = delete_file("../bad".into()).unwrap_err();
    assert!(err.contains("outside"));
}

#[test]
fn archive_file_invalid_path() {
    let _guard = TEST_MUTEX.lock().unwrap();
    let dir = tempdir().unwrap();
    let archive = dir.path().join("arc");
    std::env::set_var("PHILLOS_STORAGE_DIR", dir.path());
    std::env::set_var("PHILLOS_ARCHIVE_DIR", &archive);
    let err = archive_file("../bad".into()).unwrap_err();
    assert!(err.contains("outside"));
}

#[test]
fn query_scheduler_parses_response() {
    let _guard = TEST_MUTEX.lock().unwrap();
    let mut ioc = QueryIoc::default();
    ioc.res.result = ((1.25f32).to_bits() as u64) << 32 | 42;
    unsafe { IOCTL_RESP = Some(ioc); }
    let stats = query_scheduler().unwrap();
    assert_eq!(stats.task_count, 42);
    assert!((stats.last_residual - 1.25).abs() < f32::EPSILON);
}

#[test]
fn next_device_event_returns_event() {
    let _guard = TEST_MUTEX.lock().unwrap();
    let mut ioc = QueryIoc::default();
    ioc.res.result = 1;
    ioc.event.added = 1;
    ioc.event.dev.bus = 1;
    ioc.event.dev.slot = 2;
    ioc.event.dev.func = 3;
    ioc.event.dev.vendor_id = 0x1234;
    ioc.event.dev.device_id = 0x5678;
    ioc.event.dev.class_code = 0x9;
    ioc.event.dev.subclass = 0x2;
    unsafe { IOCTL_RESP = Some(ioc); }
    let ev = next_device_event().unwrap().unwrap();
    assert!(ev.added);
    assert_eq!(ev.bus, 1);
    assert_eq!(ev.slot, 2);
    assert_eq!(ev.func, 3);
    assert_eq!(ev.vendor_id, 0x1234);
    assert_eq!(ev.device_id, 0x5678);
    assert_eq!(ev.class_code, 0x9);
    assert_eq!(ev.subclass, 0x2);
}

#[test]
fn list_dir_returns_entries() {
    let _guard = TEST_MUTEX.lock().unwrap();
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
    let _guard = TEST_MUTEX.lock().unwrap();
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
    let _guard = TEST_MUTEX.lock().unwrap();
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

#[test]
fn prefetch_files_copies_to_cache() {
    let _guard = TEST_MUTEX.lock().unwrap();
    let dir = tempdir().unwrap();
    let base = dir.path().join("base");
    let cache = dir.path().join("cache");
    std::fs::create_dir(&base).unwrap();
    std::env::set_var("PHILLOS_STORAGE_DIR", &base);
    std::env::set_var("PHILLOS_CACHE_DIR", &cache);

    let src = base.join("a.txt");
    std::fs::write(&src, b"hi").unwrap();

    prefetch_files(vec!["a.txt".into()]).unwrap();
    assert!(cache.join("a.txt").exists());
}

#[test]
fn open_conn_uses_storage_dir() {
    let _guard = TEST_MUTEX.lock().unwrap();
    let dir = tempdir().unwrap();
    std::env::set_var("PHILLOS_STORAGE_DIR", dir.path());
    {
        let _ = open_conn().unwrap();
    }
    assert!(dir.path().join("events.db").exists());
}

#[test]
fn open_conn_creates_dir_if_missing() {
    let _guard = TEST_MUTEX.lock().unwrap();
    let dir = tempdir().unwrap();
    let sub = dir.path().join("missing");
    std::env::set_var("PHILLOS_STORAGE_DIR", &sub);
    {
        let _ = open_conn().unwrap();
    }
    assert!(sub.join("events.db").exists());
}

#[test]
fn delete_file_removes_file() {
    let _guard = TEST_MUTEX.lock().unwrap();
    let dir = tempdir().unwrap();
    std::env::set_var("PHILLOS_STORAGE_DIR", dir.path());
    let file = dir.path().join("a.txt");
    std::fs::write(&file, b"hi").unwrap();
    delete_file("a.txt".into()).unwrap();
    assert!(!file.exists());
}

#[test]
fn archive_file_moves_to_archive_dir() {
    let _guard = TEST_MUTEX.lock().unwrap();
    let dir = tempdir().unwrap();
    let base = dir.path().join("base");
    let archive = dir.path().join("archive");
    std::fs::create_dir(&base).unwrap();
    std::env::set_var("PHILLOS_STORAGE_DIR", &base);
    std::env::set_var("PHILLOS_ARCHIVE_DIR", &archive);
    let src = base.join("a.txt");
    std::fs::write(&src, b"hi").unwrap();
    archive_file("a.txt".into()).unwrap();
    assert!(archive.join("a.txt").exists());
    assert!(!src.exists());
}

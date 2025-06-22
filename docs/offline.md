# Offline Usage Guide

PhillOS is designed to function without an internet connection once the core assets and optional models have been prepared. This document summarizes the steps required to use the system completely offline.

## Preparing Assets

1. Build the project and generate the bootable ISO using `./scripts/build.sh`.
2. Flash `dist/bootloader/phillos.iso` to a USB drive with `dd` or your preferred tool.
3. (Optional) Pre-populate `dist/proton/` by running `./scripts/setup-proton.sh` so Windows games work without network access.
4. Run `./scripts/setup-ollama.sh` if you intend to use the local Qwen model for the AI CoPilot.
5. Create an `offline.cfg` file under `EFI/PHILLOS/` on the boot media with `1` to force offline mode.

## First Boot

Boot from the prepared USB drive or load the `dist/` directory via a local web server. The service worker caches all files on first use. Subsequent boots will load entirely from the local cache.

## Updating

Rebuild the project and replace the files on the USB drive (or in your web server directory) whenever you want to update. The service worker automatically detects new versions and refreshes the cache.

When `offline.cfg` is present the bootloader sets a flag in `boot_info_t`. The kernel displays an "OFFLINE MODE" banner during initialization and avoids any network access.
The kernel also reloads `offline.cfg` after mounting the boot partition so the
mode can be toggled simply by editing the file on disk.

## Boot Messages

When `offline_reload_cfg` runs the kernel prints a short debug message
indicating the result. If the configuration file is missing the log shows:

```
offline_reload_cfg: offline.cfg missing
```

If the file exists but does not contain a recognized value it prints:

```
offline_reload_cfg: malformed config
```

After parsing the file the kernel logs whether offline mode is enabled or
disabled using one of:

```
offline mode ENABLED
offline mode DISABLED
```

## Switching Themes

`theme.cfg` in the same `EFI/PHILLOS` directory controls whether the light or
dark UI theme is used. Write `dark`, `light`, `1` or `0` to the file. The
bootloader reads it during startup and the kernel reloads it after mounting the
boot partition so you can update the look without rebuilding the ISO.

When `theme_reload_cfg` executes the kernel prints debug messages similar to the
offline loader:

```
theme_reload_cfg: theme.cfg missing
theme_reload_cfg: malformed config
theme DARK
```



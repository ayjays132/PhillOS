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


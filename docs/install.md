# Installing PhillOS

This guide summarizes how to build the operating system, create a bootable USB and enable offline mode.

## Essential Packages

Install the packages required for the bootloader and kernel from your distribution:

- `make`
- `x86_64-elf-gcc` and `x86_64-elf-binutils`
- `gnu-efi`
- `dosfstools` (provides `mkfs.fat`)
- `mtools` (provides `mcopy` and `mmd`)
- `grub-mkrescue`
- `nodejs` and `npm`
- `rustc` and `cargo`
- `@tauri-apps/cli`
- `go` (backend server)
- `python3`

Refer to [docs/building.md](building.md) for package commands on common distributions.

## Building the ISO

Run the top level build script:

```bash
./scripts/build.sh
```

Then create a bootable image:

```bash
make -C bootloader OUT_DIR=../dist/bootloader iso
```

The resulting `dist/bootloader/phillos.iso` contains the bootloader, kernel and web UI.

## Flashing and UEFI Setup

Write the ISO to a USB drive using `dd` or a graphical tool like **balenaEtcher** or **Rufus**:

```bash
sudo dd if=dist/bootloader/phillos.iso of=/dev/sdX bs=4M status=progress && sync
```

Replace `/dev/sdX` with your USB device. Boot on a UEFI system, disabling Secure Boot if unsigned images are not allowed and ensuring "UEFI only" mode is selected.

## Offline Setup

Create an `offline.cfg` file under `EFI/PHILLOS/` on the boot media with `1` to force offline mode. Optionally pre-populate Proton and Ollama assets:

1. `./scripts/setup-proton.sh <version>` to place Proton under `dist/proton/<version>/`.
2. `./scripts/setup-ollama.sh` to download the Qwen model for the local AI CoPilot.

Run these before creating the ISO so the files are bundled. See [docs/offline.md](offline.md) for usage details.

## Troubleshooting

Boot and offline issues are covered in:

- [docs/building.md#troubleshooting-offline-boot-issues](building.md#troubleshooting-offline-boot-issues)
- [docs/building.md#boot-troubleshooting](building.md#boot-troubleshooting)



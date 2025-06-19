# Building the Bootloader & Kernel

This project includes a simple UEFI bootloader and kernel written in C. Building them requires a cross toolchain and several EFI utilities.

## Required Packages

Ensure the following packages are installed on your system:

- `make`
- `x86_64-elf-gcc` and `x86_64-elf-binutils`
- `gnu-efi`
- `dosfstools` (provides `mkfs.fat`)
- `mtools` (provides `mcopy` and `mmd`)
- `grub-mkrescue`

Package names vary by distribution. Example commands:

```bash
# Debian / Ubuntu
sudo apt install make mtools dosfstools grub-efi-amd64-bin \
    grub-common binutils gnu-efi x86_64-elf-gcc

# Arch Linux
sudo pacman -S make mtools dosfstools grub x86_64-elf-gcc \
    x86_64-elf-binutils gnu-efi

# Fedora
sudo dnf install make mtools dosfstools grub2-tools \
    x86_64-elf-gcc binutils gnu-efi
```

If your distribution does not provide `x86_64-elf-gcc`, you can build it from source using a standard cross-compiler build script.

## Verifying the Toolchain

After installation, verify that the cross compiler is available in `PATH`:

```bash
$ x86_64-elf-gcc --version
$ which x86_64-elf-gcc
```

Both commands should succeed. If not, review your install steps or adjust your environment.

Before the first build run `./scripts/setup-vkd3d.sh` to fetch the vkd3d-proton sources. They are cached under `external/vkd3d` so subsequent builds work offline.

## Building

With the prerequisites installed, run the top-level build script:

```bash
./scripts/build.sh
```

Bootloader artifacts are placed in `dist/bootloader` and the web UI build is written directly to `dist/`.

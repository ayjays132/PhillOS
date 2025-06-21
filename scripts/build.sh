#!/bin/sh
set -e

# Requires the x86_64-elf cross toolchain and EFI utilities in PATH
# See docs/building.md for setup instructions.

# Ensure vkd3d-proton sources are present
./scripts/setup-vkd3d.sh

# Build vkd3d-proton if Makefile exists
if [ -f external/vkd3d/Makefile ]; then
    make -C external/vkd3d
fi

# Build libphone for the bridge service
if [ -f drivers/phone/Makefile ]; then
    make -C drivers/phone
    cp drivers/phone/libphone.so .
fi

# Generate boot animation asset if source exists
if [ -f bootloader/bootanim.svg ]; then
    python3 scripts/embed_svg.py bootloader/bootanim.svg dist/bootloader/bootanim.svgz
fi

# Build bootloader and kernel image
make -C bootloader OUT_DIR=../dist/bootloader

# Compile kernel utilities
if [ -f kernel/Makefile ]; then
    make -C kernel
fi

# Build web UI
npm run build

# Build the Tauri backend when Cargo is available
if command -v cargo >/dev/null 2>&1; then
    cargo build --release --manifest-path src-tauri/Cargo.toml
    cp src-tauri/target/release/phillos_tauri dist/phillos-tauri || true
fi

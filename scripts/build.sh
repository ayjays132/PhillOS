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

# Build bootloader and kernel
make -C bootloader OUT_DIR=../dist/bootloader

# Build web UI
npm run build

#!/bin/sh
set -e

# Requires the x86_64-elf cross toolchain and EFI utilities in PATH
# See docs/building.md for setup instructions.

# Build bootloader and kernel
make -C bootloader OUT_DIR=../dist/bootloader

# Build web UI
npm run build

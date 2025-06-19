#!/bin/sh
set -e

# Build bootloader and kernel
make -C bootloader OUT_DIR=../dist/bootloader

# Build web UI
npm run build

#!/bin/sh
set -e
PREFIX="${CROSS_COMPILE:-x86_64-elf-}"
CC="${PREFIX}gcc"
OBJCOPY="${PREFIX}objcopy"
CFLAGS="-fpic -fshort-wchar -mno-red-zone -fno-stack-protector -ffreestanding -I/usr/include/efi -I/usr/include/efi/x86_64 -I../kernel -I../kernel/memory"
LDFLAGS="-nostdlib -znocombreloc -T /usr/lib/elf_x86_64_efi.lds -shared -Bsymbolic -L/usr/lib -lefi -lgnuefi"
OUT_DIR="${1:-build}"

for tool in "$CC" "$OBJCOPY"; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        echo "Error: required tool '$tool' not found" >&2
        exit 1
    fi
done

mkdir -p "$OUT_DIR"
$CC "$CFLAGS" -c main.c -o "$OUT_DIR/main.o"
$CC "$CFLAGS" -c ../kernel/init.c -o "$OUT_DIR/init.o"
$CC "$CFLAGS" -c ../kernel/memory/paging.c -o "$OUT_DIR/paging.o"
$CC "$CFLAGS" -c ../kernel/memory/alloc.c -o "$OUT_DIR/alloc.o"
$CC "$CFLAGS" -c ../drivers/storage/ahci.c -o "$OUT_DIR/ahci.o"
$CC "$CFLAGS" -c ../drivers/graphics/framebuffer.c -o "$OUT_DIR/framebuffer.o"

$CC "$CFLAGS" "$LDFLAGS" /usr/lib/crt0-efi-x86_64.o \
    "$OUT_DIR/main.o" "$OUT_DIR/init.o" "$OUT_DIR/paging.o" "$OUT_DIR/alloc.o" "$OUT_DIR/ahci.o" "$OUT_DIR/framebuffer.o" \
    -o "$OUT_DIR/bootloader.so"
$OBJCOPY -j .text -j .sdata -j .data -j .dynamic -j .dynsym -j .rel -j .rela -j .reloc -j .eh_frame --target=efi-app-x86_64 "$OUT_DIR/bootloader.so" "$OUT_DIR/BOOTX64.EFI"

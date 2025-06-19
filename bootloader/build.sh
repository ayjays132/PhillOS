#!/bin/sh
set -e
PREFIX="${CROSS_COMPILE:-x86_64-elf-}"
CC="${PREFIX}gcc"
LD="${PREFIX}ld"
OBJCOPY="${PREFIX}objcopy"
CFLAGS="-fpic -fshort-wchar -mno-red-zone -fno-stack-protector -ffreestanding -I/usr/include/efi -I/usr/include/efi/x86_64 -I../kernel -I../kernel/memory"
KERNEL_CFLAGS="-fpic -fshort-wchar -mno-red-zone -fno-stack-protector -ffreestanding -I../kernel -I../kernel/memory -I../drivers/storage -I../drivers/graphics -I/usr/include/efi -I/usr/include/efi/x86_64"
LDFLAGS="-nostdlib -znocombreloc -T /usr/lib/elf_x86_64_efi.lds -shared -Bsymbolic -L/usr/lib -lefi -lgnuefi"
OUT_DIR="${1:-build}"

for tool in "$CC" "$LD" "$OBJCOPY"; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        echo "Error: required tool '$tool' not found" >&2
        exit 1
    fi
done

mkdir -p "$OUT_DIR"

# build kernel
$CC $KERNEL_CFLAGS -c ../kernel/init.c -o "$OUT_DIR/init.o"
$CC $KERNEL_CFLAGS -c ../kernel/string.c -o "$OUT_DIR/string.o"
$CC $KERNEL_CFLAGS -c ../kernel/memory/paging.c -o "$OUT_DIR/paging.o"
$CC $KERNEL_CFLAGS -c ../kernel/memory/alloc.c -o "$OUT_DIR/alloc.o"
$CC $KERNEL_CFLAGS -c ../drivers/storage/ahci.c -o "$OUT_DIR/ahci.o"
$CC $KERNEL_CFLAGS -c ../drivers/graphics/framebuffer.c -o "$OUT_DIR/framebuffer.o"
$LD -e kernel_main $LDFLAGS \
    -o "$OUT_DIR/kernel.elf" \
    "$OUT_DIR/init.o" "$OUT_DIR/string.o" "$OUT_DIR/paging.o" "$OUT_DIR/alloc.o" \
    "$OUT_DIR/ahci.o" "$OUT_DIR/framebuffer.o"

# build bootloader
$CC $CFLAGS -c main.c -o "$OUT_DIR/main.o"
$LD $LDFLAGS -o "$OUT_DIR/bootloader.so" /usr/lib/crt0-efi-x86_64.o "$OUT_DIR/main.o"
$OBJCOPY -j .text -j .sdata -j .data -j .dynamic -j .dynsym -j .rel -j .rela -j .reloc -j .eh_frame --target=efi-app-x86_64 "$OUT_DIR/bootloader.so" "$OUT_DIR/BOOTX64.EFI"

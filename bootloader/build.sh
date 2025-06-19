#!/bin/sh
set -e
CC=x86_64-elf-gcc
OBJCOPY=x86_64-elf-objcopy
CFLAGS="-fpic -fshort-wchar -mno-red-zone -fno-stack-protector -ffreestanding -I/usr/include/efi -I/usr/include/efi/x86_64 -I../kernel -I../kernel/memory"
LDFLAGS="-nostdlib -znocombreloc -T /usr/lib/elf_x86_64_efi.lds -shared -Bsymbolic -L/usr/lib -lefi -lgnuefi"
mkdir -p build
$CC $CFLAGS -c main.c -o build/main.o
$CC $CFLAGS -c ../kernel/init.c -o build/init.o
$CC $CFLAGS -c ../kernel/memory/paging.c -o build/paging.o
$CC $CFLAGS -c ../kernel/memory/alloc.c -o build/alloc.o

$CC $CFLAGS $LDFLAGS /usr/lib/crt0-efi-x86_64.o \
    build/main.o build/init.o build/paging.o build/alloc.o \
    -o build/bootloader.so
$OBJCOPY -j .text -j .sdata -j .data -j .dynamic -j .dynsym -j .rel -j .rela -j .reloc -j .eh_frame --target=efi-app-x86_64 build/bootloader.so build/BOOTX64.EFI

# Makefile for PhillOS bootloader

PREFIX ?= $(CROSS_COMPILE)x86_64-elf-
CC := $(PREFIX)gcc
LD := $(PREFIX)ld
OBJCOPY := $(PREFIX)objcopy

OUT_DIR ?= build
ESP_IMG ?= $(OUT_DIR)/esp.img
ISO ?= $(OUT_DIR)/phillos.iso

CFLAGS := -fpic -fshort-wchar -mno-red-zone -fno-stack-protector 	-ffreestanding -I/usr/include/efi -I/usr/include/efi/x86_64 	-I../kernel -I../kernel/memory
KERNEL_CFLAGS := -fpic -fshort-wchar -mno-red-zone -fno-stack-protector 	-ffreestanding -I../kernel -I../kernel/memory 	-I../drivers/storage -I../drivers/graphics 	-I/usr/include/efi -I/usr/include/efi/x86_64
LDFLAGS := -nostdlib -znocombreloc -T /usr/lib/elf_x86_64_efi.lds 	-shared -Bsymbolic -L/usr/lib -lefi -lgnuefi

BOOTLOADER := $(OUT_DIR)/BOOTX64.EFI
KERNEL_ELF := $(OUT_DIR)/kernel.elf

KERNEL_OBJS := $(OUT_DIR)/init.o 	$(OUT_DIR)/string.o 	$(OUT_DIR)/paging.o 	$(OUT_DIR)/alloc.o      $(OUT_DIR)/debug.o 	$(OUT_DIR)/ahci.o 	$(OUT_DIR)/framebuffer.o $(OUT_DIR)/gpu.o $(OUT_DIR)/nvidia.o $(OUT_DIR)/amd.o $(OUT_DIR)/intel.o

.PHONY: all iso clean

all: $(BOOTLOADER) $(ESP_IMG)

$(OUT_DIR):
	mkdir -p $@

# Kernel objects
$(OUT_DIR)/init.o: ../kernel/init.c | $(OUT_DIR)
	$(CC) $(KERNEL_CFLAGS) -c $< -o $@
$(OUT_DIR)/string.o: ../kernel/string.c | $(OUT_DIR)
	$(CC) $(KERNEL_CFLAGS) -c $< -o $@
$(OUT_DIR)/paging.o: ../kernel/memory/paging.c | $(OUT_DIR)
	$(CC) $(KERNEL_CFLAGS) -c $< -o $@
$(OUT_DIR)/alloc.o: ../kernel/memory/alloc.c | $(OUT_DIR)
	$(CC) $(KERNEL_CFLAGS) -c $< -o $@
$(OUT_DIR)/debug.o: ../kernel/debug.c | $(OUT_DIR)
	$(CC) $(KERNEL_CFLAGS) -c $< -o $@
$(OUT_DIR)/ahci.o: ../drivers/storage/ahci.c | $(OUT_DIR)
	$(CC) $(KERNEL_CFLAGS) -c $< -o $@
$(OUT_DIR)/framebuffer.o: ../drivers/graphics/framebuffer.c | $(OUT_DIR)
	$(CC) $(KERNEL_CFLAGS) -c $< -o $@
$(OUT_DIR)/gpu.o: ../drivers/graphics/gpu.c | $(OUT_DIR)
	$(CC) $(KERNEL_CFLAGS) -c $< -o $@
$(OUT_DIR)/nvidia.o: ../drivers/graphics/nvidia.c | $(OUT_DIR)
	$(CC) $(KERNEL_CFLAGS) -c $< -o $@
$(OUT_DIR)/amd.o: ../drivers/graphics/amd.c | $(OUT_DIR)
	$(CC) $(KERNEL_CFLAGS) -c $< -o $@
$(OUT_DIR)/intel.o: ../drivers/graphics/intel.c | $(OUT_DIR)
	$(CC) $(KERNEL_CFLAGS) -c $< -o $@

$(KERNEL_ELF): $(KERNEL_OBJS)
	$(LD) -e kernel_main $(LDFLAGS) -o $@ $(KERNEL_OBJS)

# Bootloader
$(OUT_DIR)/main.o: main.c | $(OUT_DIR)
	$(CC) $(CFLAGS) -c $< -o $@

$(BOOTLOADER): $(OUT_DIR)/main.o | $(OUT_DIR)
	$(LD) $(LDFLAGS) -o $(OUT_DIR)/bootloader.so /usr/lib/crt0-efi-x86_64.o $<
	$(OBJCOPY) -j .text -j .sdata -j .data -j .dynamic -j .dynsym 		-j .rel -j .rela -j .reloc -j .eh_frame 		--target=efi-app-x86_64 $(OUT_DIR)/bootloader.so $@

# EFI System Partition image
$(ESP_IMG): $(BOOTLOADER) $(KERNEL_ELF) | $(OUT_DIR)
	rm -f $@
	dd if=/dev/zero of=$@ bs=1M count=64
	mkfs.fat -n PHILLOS $@
	mkdir -p $(OUT_DIR)/esp/EFI/BOOT
	mkdir -p $(OUT_DIR)/esp/EFI/PHILLOS
	cp $(BOOTLOADER) $(OUT_DIR)/esp/EFI/BOOT/
	cp $(KERNEL_ELF) $(OUT_DIR)/esp/EFI/PHILLOS/
	mcopy -s -i $@ $(OUT_DIR)/esp/* ::/
	rm -rf $(OUT_DIR)/esp

iso: $(ESP_IMG)
	grub-mkrescue -o $(ISO) $(ESP_IMG)

clean:
	rm -rf $(OUT_DIR)

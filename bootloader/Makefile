# Makefile for PhillOS bootloader

PREFIX ?= $(CROSS_COMPILE)x86_64-elf-
CC := $(PREFIX)gcc
	LD := $(PREFIX)ld

OUT_DIR ?= build
ESP_IMG ?= $(OUT_DIR)/esp.img
ISO ?= $(OUT_DIR)/phillos.iso
# Boot animation paths
BOOTANIM_SRC ?= bootanim.svg
BOOTANIM ?= $(OUT_DIR)/bootanim.svgz
# Boot cursor paths
CURSOR_LIGHT_SRC ?= cursor_light.svg
CURSOR_DARK_SRC ?= cursor_dark.svg
CURSOR_LIGHT ?= $(OUT_DIR)/cursor_light.svgz
CURSOR_DARK ?= $(OUT_DIR)/cursor_dark.svgz

# Optional eBPF objects to include in the boot image
INCLUDE_BPF ?= 0
BPF_DIR ?= bpf
BPF_OBJECTS ?= anomaly.bpf.o
BPF_FILES := $(addprefix $(BPF_DIR)/,$(BPF_OBJECTS))

# Secure Boot signing
SIGN_KEY ?= keys/db.key
SIGN_CERT ?= keys/db.crt
SIGNED_BOOTLOADER := $(OUT_DIR)/BOOTX64.EFI.signed
CFLAGS := -fpic -fshort-wchar -mno-red-zone -fno-stack-protector 	-ffreestanding -I/usr/include/efi -I/usr/include/efi/x86_64 	-I../kernel -I../kernel/memory -I../include
KERNEL_CFLAGS := -fpic -fshort-wchar -mno-red-zone -fno-stack-protector 	-ffreestanding -I../kernel -I../kernel/memory -I../kernel/fs -I../drivers/storage -I../drivers/graphics -I../include 	-I/usr/include/efi -I/usr/include/efi/x86_64
LDFLAGS := -nostdlib -znocombreloc -T /usr/lib/elf_x86_64_efi.lds 	-shared -Bsymbolic -L/usr/lib -lefi -lgnuefi

BOOTLOADER := $(OUT_DIR)/BOOTX64.EFI
KERNEL_ELF := $(OUT_DIR)/kernel.elf

KERNEL_OBJS := $(OUT_DIR)/init.o 	$(OUT_DIR)/string.o 	$(OUT_DIR)/paging.o 	$(OUT_DIR)/alloc.o $(OUT_DIR)/heap.o $(OUT_DIR)/query.o      $(OUT_DIR)/debug.o $(OUT_DIR)/driver_manager.o $(OUT_DIR)/register.o 	$(OUT_DIR)/ahci.o 	$(OUT_DIR)/framebuffer.o $(OUT_DIR)/gpu.o $(OUT_DIR)/nvidia.o $(OUT_DIR)/amd.o $(OUT_DIR)/intel.o $(OUT_DIR)/vkd3d.o $(OUT_DIR)/fat32.o $(OUT_DIR)/elf.o $(OUT_DIR)/uhs.o $(OUT_DIR)/chaos_sched.o $(OUT_DIR)/offline.o $(OUT_DIR)/theme.o

.PHONY: all iso clean

all: $(SIGNED_BOOTLOADER) $(ESP_IMG)

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
$(OUT_DIR)/heap.o: ../kernel/memory/heap.c | $(OUT_DIR)
	$(CC) $(KERNEL_CFLAGS) -c $< -o $@
$(OUT_DIR)/query.o: ../kernel/query.c | $(OUT_DIR)
	$(CC) $(KERNEL_CFLAGS) -c $< -o $@
$(OUT_DIR)/debug.o: ../kernel/debug.c | $(OUT_DIR)
	$(CC) $(KERNEL_CFLAGS) -c $< -o $@
$(OUT_DIR)/driver_manager.o: ../drivers/driver_manager.c | $(OUT_DIR)
	$(CC) $(KERNEL_CFLAGS) -c $< -o $@
$(OUT_DIR)/register.o: ../drivers/register.c | $(OUT_DIR)
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

$(OUT_DIR)/vkd3d.o: ../drivers/graphics/vkd3d.c | $(OUT_DIR)
	$(CC) $(KERNEL_CFLAGS) -c $< -o $@

$(OUT_DIR)/fat32.o: ../kernel/fs/fat32.c | $(OUT_DIR)
	$(CC) $(KERNEL_CFLAGS) -c $< -o $@

$(OUT_DIR)/elf.o: ../kernel/elf.c | $(OUT_DIR)
	$(CC) $(KERNEL_CFLAGS) -c $< -o $@

$(OUT_DIR)/uhs.o: ../kernel/scheduler/uhs.c | $(OUT_DIR)
	$(CC) $(KERNEL_CFLAGS) -c $< -o $@

$(OUT_DIR)/chaos_sched.o: ../kernel/scheduler/chaos_sched.c | $(OUT_DIR)
	$(CC) $(KERNEL_CFLAGS) -c $< -o $@

$(OUT_DIR)/offline.o: ../kernel/offline.c | $(OUT_DIR)
        $(CC) $(KERNEL_CFLAGS) -c $< -o $@

$(OUT_DIR)/theme.o: ../kernel/theme.c | $(OUT_DIR)
        $(CC) $(KERNEL_CFLAGS) -c $< -o $@

$(KERNEL_ELF): $(KERNEL_OBJS)
	$(LD) -e kernel_main $(LDFLAGS) -o $@ $(KERNEL_OBJS)
	@if [ -f "$(SIGN_KEY)" ]; then \
		python3 ../scripts/sign_module.py $(SIGN_KEY) $@; \
	fi

# Bootloader
$(OUT_DIR)/main.o: main.c | $(OUT_DIR)
	$(CC) $(CFLAGS) -c $< -o $@
$(OUT_DIR)/phill_svg_loader.o: phill_svg_loader.c | $(OUT_DIR)
	$(CC) $(CFLAGS) -c $< -o $@
$(OUT_DIR)/phill_svg_update.o: phill_svg_update.c | $(OUT_DIR)
	$(CC) $(CFLAGS) -c $< -o $@
$(OUT_DIR)/bn.o: ../kernel/security/bn.c | $(OUT_DIR)
	$(CC) $(CFLAGS) -c $< -o $@
$(OUT_DIR)/signature.o: ../kernel/security/signature.c | $(OUT_DIR)
	$(CC) $(CFLAGS) -c $< -o $@

BOOTLOADER_OBJS := $(OUT_DIR)/main.o $(OUT_DIR)/phill_svg_loader.o $(OUT_DIR)/phill_svg_update.o $(OUT_DIR)/bn.o $(OUT_DIR)/signature.o

$(BOOTLOADER): $(BOOTLOADER_OBJS) | $(OUT_DIR)
	$(LD) $(LDFLAGS) -o $(OUT_DIR)/bootloader.so /usr/lib/crt0-efi-x86_64.o $^
	$(OBJCOPY) -j .text -j .sdata -j .data -j .dynamic -j .dynsym 		-j .rel -j .rela -j .reloc -j .eh_frame 		--target=efi-app-x86_64 $(OUT_DIR)/bootloader.so $@

$(SIGNED_BOOTLOADER): $(BOOTLOADER)
        @if [ -f "$(SIGN_KEY)" ] && [ -f "$(SIGN_CERT)" ]; then \
        sbsign --key $(SIGN_KEY) --cert $(SIGN_CERT) --output $@ $<; \
        else \
        cp $< $@; \
        fi

$(BOOTANIM): $(BOOTANIM_SRC) | $(OUT_DIR)
        python3 ../scripts/embed_svg.py $< $@
$(CURSOR_LIGHT): $(CURSOR_LIGHT_SRC) | $(OUT_DIR)
        python3 ../scripts/embed_svg.py $< $@
$(CURSOR_DARK): $(CURSOR_DARK_SRC) | $(OUT_DIR)
        python3 ../scripts/embed_svg.py $< $@
# EFI System Partition image
$(ESP_IMG): $(SIGNED_BOOTLOADER) $(KERNEL_ELF) $(BOOTANIM) $(CURSOR_LIGHT) $(CURSOR_DARK) $(BPF_FILES) | $(OUT_DIR)
	rm -f $@
	dd if=/dev/zero of=$@ bs=1M count=64
	mkfs.fat -n PHILLOS $@
	mkdir -p $(OUT_DIR)/esp/EFI/BOOT
	mkdir -p $(OUT_DIR)/esp/EFI/PHILLOS
        cp $(SIGNED_BOOTLOADER) $(OUT_DIR)/esp/EFI/BOOT/BOOTX64.EFI
        cp $(KERNEL_ELF) $(OUT_DIR)/esp/EFI/PHILLOS/
        cp $(BOOTANIM) $(OUT_DIR)/esp/EFI/PHILLOS/
        cp $(CURSOR_LIGHT) $(OUT_DIR)/esp/EFI/PHILLOS/
        cp $(CURSOR_DARK) $(OUT_DIR)/esp/EFI/PHILLOS/
ifneq ($(INCLUDE_BPF),0)
        mkdir -p $(OUT_DIR)/esp/lib/phillos
        cp $(BPF_FILES) $(OUT_DIR)/esp/lib/phillos/
endif
        mcopy -s -i $@ $(OUT_DIR)/esp/* ::/
        rm -rf $(OUT_DIR)/esp

iso: $(ESP_IMG)
	grub-mkrescue -o $(ISO) $(ESP_IMG)

clean:
	rm -rf $(OUT_DIR)

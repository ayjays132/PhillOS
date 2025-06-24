#include "vkd3d.h"
#include "../../kernel/debug.h"
#include "../../kernel/fs/fat32.h"
#include "../../kernel/memory/heap.h"
#include "../../kernel/elf.h"
#include <stdint.h>

#define VKD3D_LIB_PATH "/usr/lib/phillos/vkd3d/libvkd3d-proton.so"

static elf_image_t vkd3d_mod = {0};

static int load_vkd3d_library(void)
{
    debug_puts("Loading vkd3d library: ");
    debug_puts(VKD3D_LIB_PATH);
    debug_putc('\n');
    if (vkd3d_mod.base)
        return 0;

    uint32_t sz = 0;
    void *file = fat32_load_file(VKD3D_LIB_PATH, &sz);
    if (!file) {
        debug_puts("Failed to load library\n");
        return -1;
    }

    if (elf_load_image(file, sz, &vkd3d_mod)) {
        debug_puts("Invalid ELF image\n");
        kfree(file);
        return -1;
    }

    kfree(file);

    debug_puts("vkd3d loaded at 0x");
    debug_puthex64((uint64_t)(uintptr_t)vkd3d_mod.base);
    debug_putc('\n');
    return 0;
}

int init_vkd3d(gpu_vendor_t vendor)
{
    const char *name = "Unknown";
    switch (vendor) {
    case GPU_VENDOR_NVIDIA:
        name = "Nvidia";
        break;
    case GPU_VENDOR_AMD:
        name = "AMD";
        break;
    case GPU_VENDOR_INTEL:
        name = "Intel";
        break;
    default:
        break;
    }

    debug_puts("Initializing vkd3d for ");
    debug_puts(name);
    debug_putc('\n');

    return load_vkd3d_library();
}

#include "vkd3d.h"
#include "../../kernel/debug.h"
#include "../../kernel/fs/fat32.h"
#include "../../kernel/memory/heap.h"
#include <stdint.h>

#define VKD3D_LIB_PATH "/usr/lib/phillos/vkd3d/libvkd3d-proton.so"

static void *vkd3d_image = NULL;
static uint32_t vkd3d_size = 0;

static void load_vkd3d_library(void)
{
    debug_puts("Loading vkd3d library: ");
    debug_puts(VKD3D_LIB_PATH);
    debug_putc('\n');
    if (!vkd3d_image) {
        vkd3d_image = fat32_load_file(VKD3D_LIB_PATH, &vkd3d_size);
        if (!vkd3d_image) {
            debug_puts("Failed to load library\n");
            return;
        }
        uint8_t *b = (uint8_t *)vkd3d_image;
        if (vkd3d_size < 4 || b[0] != 0x7f || b[1] != 'E' || b[2] != 'L' || b[3] != 'F') {
            debug_puts("Invalid ELF image\n");
            kfree(vkd3d_image);
            vkd3d_image = NULL;
            vkd3d_size = 0;
            return;
        }
        debug_puts("vkd3d loaded at 0x");
        debug_puthex64((uint64_t)(uintptr_t)vkd3d_image);
        debug_puts(" size 0x");
        debug_puthex(vkd3d_size);
        debug_putc('\n');
    }
}

void init_vkd3d(gpu_vendor_t vendor)
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

    load_vkd3d_library();
}

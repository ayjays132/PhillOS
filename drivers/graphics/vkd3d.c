#include "vkd3d.h"
#include "../../kernel/debug.h"

#define VKD3D_LIB_PATH "/usr/lib/phillos/vkd3d/libvkd3d-proton.so"

static void load_vkd3d_library(void)
{
    debug_puts("Loading vkd3d library: ");
    debug_puts(VKD3D_LIB_PATH);
    debug_putc('\n');
    /* TODO: implement file I/O and dynamic loader */
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

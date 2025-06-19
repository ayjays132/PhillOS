#include "vkd3d.h"
#include "../../kernel/debug.h"

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
}

#include "gpu.h"
#include "nvidia.h"
#include "amd.h"
#include "intel.h"
#include "vkd3d.h"
#include "../../kernel/debug.h"
#include "../../kernel/boot_info.h"
#include "../../kernel/fs/fat32.h"
#include "../../kernel/memory/heap.h"
#include <string.h>

static inline uint32_t pci_read32(uint8_t bus, uint8_t slot,
                                  uint8_t func, uint8_t offset)
{
    uint32_t addr = (uint32_t)(1 << 31) |
                    ((uint32_t)bus << 16) |
                    ((uint32_t)slot << 11) |
                    ((uint32_t)func << 8) |
                    (offset & 0xfc);
    __asm__ volatile("outl %0, %1" :: "a"(addr), "d"((uint16_t)0xcf8));
    uint32_t data;
    __asm__ volatile("inl %1, %0" : "=a"(data) : "d"((uint16_t)0xcfc));
    return data;
}

/* Scan PCI bus for common GPU vendors */
gpu_vendor_t detect_gpu_vendor(void)
{
    for (uint8_t bus = 0; bus < 256; bus++) {
        for (uint8_t slot = 0; slot < 32; slot++) {
            uint16_t vendor = pci_read32(bus, slot, 0, 0) & 0xFFFF;
            if (vendor == 0xFFFF)
                continue;

            uint32_t classcode = pci_read32(bus, slot, 0, 8);
            uint8_t class = (classcode >> 24) & 0xFF;
            if (class != 0x03) /* display controller */
                continue;

            if (vendor == 0x10DE)
                return GPU_VENDOR_NVIDIA;
            if (vendor == 0x1002)
                return GPU_VENDOR_AMD;
            if (vendor == 0x8086)
                return GPU_VENDOR_INTEL;
        }
    }
    return GPU_VENDOR_UNKNOWN;
}

static gpu_driver_t *active_driver = NULL;

gpu_driver_t *gpu_get_active_driver(void)
{
    return active_driver;
}

void gpu_set_active_driver(gpu_driver_t *drv)
{
    active_driver = drv;
}

static int str_eq(const char *a, const char *b)
{
    while (*a && *b) {
        if (*a != *b)
            return 0;
        a++; b++;
    }
    return *a == 0 && *b == 0;
}

static const char *get_cmdline(void)
{
    extern boot_info_t *boot_info_get(void);
    boot_info_t *info = boot_info_get();
    return info ? info->cmdline : "";
}

static gpu_vendor_t parse_gpu_param(void)
{
    const char *cmd = get_cmdline();
    const char *p = cmd;
    while (*p) {
        while (*p == ' ')
            p++;
        if (!*p)
            break;
        if (p[0]=='g' && p[1]=='p' && p[2]=='u' && p[3]=='=') {
            p += 4;
            if (str_eq(p, "none"))
                return GPU_VENDOR_UNKNOWN;
            if (str_eq(p, "nvidia"))
                return GPU_VENDOR_NVIDIA;
            if (str_eq(p, "amd"))
                return GPU_VENDOR_AMD;
            if (str_eq(p, "intel"))
                return GPU_VENDOR_INTEL;
            /* unrecognized => auto */
            break;
        }
        while (*p && *p != ' ')
            p++;
    }
    return (gpu_vendor_t)-1; /* auto */
}

void init_gpu_driver(void)
{
    boot_info_t *info = boot_info_get();
    gpu_vendor_t vendor = info ? info->gpu_override : GPU_VENDOR_UNKNOWN;
    if (vendor == GPU_VENDOR_UNKNOWN) {
        vendor = parse_gpu_param();
        if (vendor == (gpu_vendor_t)-1)
            vendor = detect_gpu_vendor();
    }
    const char *name = "Unknown";
    gpu_driver_t *drv = NULL;
    switch (vendor) {
    case GPU_VENDOR_NVIDIA:
        name = "Nvidia";
        drv = &nvidia_driver;
        break;
    case GPU_VENDOR_AMD:
        name = "AMD";
        drv = &amd_driver;
        break;
    case GPU_VENDOR_INTEL:
        name = "Intel";
        drv = &intel_driver;
        break;
    default:
        break;
    }

    debug_puts("GPU vendor: ");
    debug_puts(name);
    debug_putc('\n');

    if (drv && drv->init) {
        active_driver = drv;
        drv->init();
        if (drv->set_mode) {
            boot_info_t *info = boot_info_get();
            uint32_t w = info ? info->display_width : 0;
            uint32_t h = info ? info->display_height : 0;
            drv->set_mode(w, h);
        }
        if (drv->enable_vulkan)
            drv->enable_vulkan();
    }

    if (init_vkd3d(vendor))
        debug_puts("vkd3d unavailable\n");
}

void gpu_reload_cfg(void)
{
    uint32_t size = 0;
    char *data = fat32_load_file("/EFI/PHILLOS/gpu.cfg", &size);
    if (!data) {
        debug_puts("gpu_reload_cfg: gpu.cfg missing\n");
        return;
    }
    gpu_vendor_t vendor = GPU_VENDOR_UNKNOWN;
    int valid = 0;
    if (size >= 6 &&
        ((data[0]=='n'||data[0]=='N') &&
         (data[1]=='v'||data[1]=='V') &&
         (data[2]=='i'||data[2]=='I') &&
         (data[3]=='d'||data[3]=='D') &&
         (data[4]=='i'||data[4]=='I') &&
         (data[5]=='a'||data[5]=='A'))) {
        vendor = GPU_VENDOR_NVIDIA;
        valid = 1;
    } else if (size >= 3 &&
               ((data[0]=='a'||data[0]=='A') &&
                (data[1]=='m'||data[1]=='M') &&
                (data[2]=='d'||data[2]=='D'))) {
        vendor = GPU_VENDOR_AMD;
        valid = 1;
    } else if (size >= 5 &&
               ((data[0]=='i'||data[0]=='I') &&
                (data[1]=='n'||data[1]=='N') &&
                (data[2]=='t'||data[2]=='T') &&
                (data[3]=='e'||data[3]=='E') &&
                (data[4]=='l'||data[4]=='L'))) {
        vendor = GPU_VENDOR_INTEL;
        valid = 1;
    } else if (size >= 4 &&
               ((data[0]=='n'||data[0]=='N') &&
                (data[1]=='o'||data[1]=='O') &&
                (data[2]=='n'||data[2]=='N') &&
                (data[3]=='e'||data[3]=='E'))) {
        vendor = GPU_VENDOR_UNKNOWN;
        valid = 1;
    } else if (size >= 4 &&
               ((data[0]=='a'||data[0]=='A') &&
                (data[1]=='u'||data[1]=='U') &&
                (data[2]=='t'||data[2]=='T') &&
                (data[3]=='o'||data[3]=='O'))) {
        vendor = GPU_VENDOR_UNKNOWN;
        valid = 1;
    }
    if (!valid)
        debug_puts("gpu_reload_cfg: malformed config\n");
    kfree(data);
    boot_info_t *info = boot_info_get();
    if (info)
        info->gpu_override = vendor;
    debug_puts("gpu override ");
    switch (vendor) {
    case GPU_VENDOR_NVIDIA:
        debug_puts("NVIDIA\n");
        break;
    case GPU_VENDOR_AMD:
        debug_puts("AMD\n");
        break;
    case GPU_VENDOR_INTEL:
        debug_puts("INTEL\n");
        break;
    default:
        debug_puts("UNKNOWN\n");
        break;
    }
}

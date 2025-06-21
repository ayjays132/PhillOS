#include "gpu.h"
#include "nvidia.h"
#include "amd.h"
#include "intel.h"
#include "vkd3d.h"
#include "../../kernel/debug.h"
#include "../../kernel/boot_info.h"

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
    gpu_vendor_t vendor = parse_gpu_param();
    if (vendor == (gpu_vendor_t)-1)
        vendor = detect_gpu_vendor();
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
            framebuffer_info_t *fb = &boot_info_get()->fb;
            drv->set_mode(fb->width, fb->height);
        }
        if (drv->enable_vulkan)
            drv->enable_vulkan();
    }

    if (init_vkd3d(vendor))
        debug_puts("vkd3d unavailable\n");
}

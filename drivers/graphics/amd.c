#include "amd.h"
#include "framebuffer.h"
#include "gfx.h"
#include "gpu.h"
#include "../../kernel/memory/paging.h"
#include "../../kernel/debug.h"
#include "../../kernel/init.h"
#include "../driver_manager.h"

static int amd_match(const pci_device_t *dev)
{
    return dev->vendor_id == 0x1002 && dev->class_code == 0x03;
}

static const pci_device_t *amd_dev = NULL;
static uintptr_t amd_mmio_base = 0;

#define AMD_D1CRTC_H_TOTAL            0x6020
#define AMD_D1CRTC_V_TOTAL            0x6024
#define AMD_D1CRTC_H_SYNC_A           0x6028
#define AMD_D1CRTC_H_SYNC_B           0x602c
#define AMD_D1CRTC_V_SYNC_A           0x6030
#define AMD_D1CRTC_V_SYNC_B           0x6034
#define AMD_D1GRPH_PRIMARY_SURFACE_ADDRESS 0x6110
#define AMD_D1GRPH_PITCH              0x6120
#define AMD_D1GRPH_ENABLE             0x6104

static inline void amd_writel(uint32_t reg, uint32_t val)
{
    volatile uint32_t *addr = (volatile uint32_t *)(amd_mmio_base + reg);
    *addr = val;
}

static inline uint32_t amd_readl(uint32_t reg)
{
    volatile uint32_t *addr = (volatile uint32_t *)(amd_mmio_base + reg);
    return *addr;
}

static void amd_program_regs(void)
{
    debug_puts("AMD: programming registers\n");
    extern boot_info_t *boot_info_get(void);
    framebuffer_info_t *fb = &boot_info_get()->fb;
    amd_writel(AMD_D1GRPH_PRIMARY_SURFACE_ADDRESS,
               (uint32_t)(fb->base & 0xFFFFFFFF));
    amd_writel(AMD_D1GRPH_PITCH, fb->pitch);
    amd_writel(AMD_D1GRPH_ENABLE, 1);
}

static int amd_set_mode(uint32_t w, uint32_t h)
{
    debug_puts("AMD: set display mode ");
    debug_puthex(w);
    debug_putc('x');
    debug_puthex(h);
    debug_putc('\n');
    extern boot_info_t *boot_info_get(void);
    framebuffer_info_t *fb = &boot_info_get()->fb;

    if (w == 0)
        w = fb->width;
    if (h == 0)
        h = fb->height;

    amd_writel(AMD_D1CRTC_H_TOTAL,
               ((w + 160) << 16) | (w - 1));
    amd_writel(AMD_D1CRTC_V_TOTAL,
               ((h + 45) << 16) | (h - 1));
    amd_writel(AMD_D1CRTC_H_SYNC_A,
               ((w + 16) << 16) | (w + 8));
    amd_writel(AMD_D1CRTC_H_SYNC_B,
               ((w + 24) << 16) | (w + 20));
    amd_writel(AMD_D1CRTC_V_SYNC_A,
               ((h + 2) << 16) | (h + 1));
    amd_writel(AMD_D1CRTC_V_SYNC_B,
               ((h + 5) << 16) | (h + 3));

    return 0;
}

static int amd_enable_vulkan(void)
{
    debug_puts("AMD: exposing Vulkan hooks\n");
    return 0;
}

static void amd_hw_init(const pci_device_t *dev)
{
    debug_puts("Initializing AMD GPU\n");

    uint32_t bar2 = pci_config_read32(dev->bus, dev->slot, dev->func, 0x18);
    uint64_t bar2_phys = (uint64_t)(bar2 & ~0xFULL);
    map_identity_range(bar2_phys, 16 * 1024 * 1024ULL);
    debug_puts("BAR2 mapped at 0x");
    debug_puthex64(bar2_phys);
    debug_putc('\n');

    amd_mmio_base = (uintptr_t)bar2_phys;

    init_framebuffer(&boot_info_get()->fb);
    gpu_set_active_gfx_device(framebuffer_get_gfx_device());
    amd_program_regs();
    gpu_set_active_driver(&amd_driver);
}

static int amd_init(void)
{
    if (!amd_dev)
        return -1;
    amd_hw_init(amd_dev);
    return 0;
}

static void amd_pnp_init(const pci_device_t *dev)
{
    amd_dev = dev;
    amd_hw_init(dev);
}

gpu_driver_t amd_driver = {
    .vendor = GPU_VENDOR_AMD,
    .init = amd_init,
    .set_mode = amd_set_mode,
    .enable_vulkan = amd_enable_vulkan,
};

driver_t amd_pnp_driver = {
    .name = "AMD GPU",
    .match = amd_match,
    .init = amd_pnp_init,
};

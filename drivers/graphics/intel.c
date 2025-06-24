#include "intel.h"
#include "framebuffer.h"
#include "gfx.h"
#include "gpu.h"
#include "../../kernel/memory/paging.h"
#include "../../kernel/debug.h"
#include "../../kernel/init.h"
#include "../driver_manager.h"

static int intel_match(const pci_device_t *dev)
{
    return dev->vendor_id == 0x8086 && dev->class_code == 0x03;
}

static const pci_device_t *intel_dev = NULL;
static uintptr_t intel_mmio_base = 0;

#define INTEL_PIPEA_CONF        0x70008
#define INTEL_PIPECONF_ENABLE   0x80000000
#define INTEL_HTOTAL_A          0x60000
#define INTEL_VTOTAL_A          0x6000c
#define INTEL_HSYNC_A           0x60008
#define INTEL_VSYNC_A           0x60014
#define INTEL_PIPEASRC          0x6001c
#define INTEL_DSPSURF_A         0x70184
#define INTEL_DSPSTRIDE_A       0x70188
#define INTEL_DSPSIZE_A         0x70190

static inline void intel_writel(uint32_t reg, uint32_t val)
{
    volatile uint32_t *addr = (volatile uint32_t *)(intel_mmio_base + reg);
    *addr = val;
}

static inline uint32_t intel_readl(uint32_t reg)
{
    volatile uint32_t *addr = (volatile uint32_t *)(intel_mmio_base + reg);
    return *addr;
}

static void intel_program_regs(void)
{
    debug_puts("Intel: programming registers\n");
    extern boot_info_t *boot_info_get(void);
    framebuffer_info_t *fb = &boot_info_get()->fb;

    intel_writel(INTEL_DSPSURF_A, (uint32_t)(fb->base & 0xFFFFFFFF));
    intel_writel(INTEL_DSPSTRIDE_A, fb->pitch * 4);
}

static int intel_set_mode(uint32_t w, uint32_t h)
{
    debug_puts("Intel: set display mode ");
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

    intel_writel(INTEL_HTOTAL_A, ((w + 160 - 1) << 16) | (w - 1));
    intel_writel(INTEL_VTOTAL_A, ((h + 45 - 1) << 16) | (h - 1));
    intel_writel(INTEL_HSYNC_A,  ((w + 8) << 16) | (w + 4));
    intel_writel(INTEL_VSYNC_A,  ((h + 1) << 16) | (h));
    intel_writel(INTEL_PIPEASRC, ((h - 1) << 16) | (w - 1));
    intel_writel(INTEL_DSPSIZE_A, ((h - 1) << 16) | (w - 1));
    intel_writel(INTEL_PIPEA_CONF,
                intel_readl(INTEL_PIPEA_CONF) | INTEL_PIPECONF_ENABLE);

    return 0;
}

static int intel_enable_vulkan(void)
{
    debug_puts("Intel: exposing Vulkan hooks\n");
    return 0;
}

static void intel_hw_init(const pci_device_t *dev)
{
    debug_puts("Initializing Intel GPU\n");

    uint32_t bar0 = pci_config_read32(dev->bus, dev->slot, dev->func, 0x10);
    uint64_t bar0_phys = (uint64_t)(bar0 & ~0xFULL);
    map_identity_range(bar0_phys, 16 * 1024 * 1024ULL);
    debug_puts("BAR0 mapped at 0x");
    debug_puthex64(bar0_phys);
    debug_putc('\n');

    intel_mmio_base = (uintptr_t)bar0_phys;

    init_framebuffer(&boot_info_get()->fb);
    gpu_set_active_gfx_device(framebuffer_get_gfx_device());
    intel_program_regs();
    gpu_set_active_driver(&intel_driver);
}

static int intel_init(void)
{
    if (!intel_dev)
        return -1;
    intel_hw_init(intel_dev);
    return 0;
}

static void intel_pnp_init(const pci_device_t *dev)
{
    intel_dev = dev;
    intel_hw_init(dev);
}

gpu_driver_t intel_driver = {
    .vendor = GPU_VENDOR_INTEL,
    .init = intel_init,
    .set_mode = intel_set_mode,
    .enable_vulkan = intel_enable_vulkan,
};

driver_t intel_pnp_driver = {
    .name = "Intel GPU",
    .match = intel_match,
    .init = intel_pnp_init,
};

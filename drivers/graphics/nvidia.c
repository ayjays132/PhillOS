#include "nvidia.h"
#include "framebuffer.h"
#include "../../kernel/memory/paging.h"
#include "../../kernel/debug.h"
#include "../../kernel/init.h"
#include "../driver_manager.h"

static int nvidia_match(const pci_device_t *dev)
{
    return dev->vendor_id == 0x10DE && dev->class_code == 0x03;
}

static const pci_device_t *nvidia_dev = NULL;
static uintptr_t nvidia_mmio_base = 0;

#define NV50_PDISPLAY_CRTC_DISPLAY_TOTAL     0x00610af8
#define NV50_PDISPLAY_CRTC_SYNC_DURATION     0x00610b00
#define NV50_PDISPLAY_CRTC_FB_SIZE           0x00610b18
#define NV50_PDISPLAY_CRTC_FB_PITCH          0x00610b20
#define NV50_PDISPLAY_CRTC_FB_PITCH_LINEAR   0x00100000
#define NV50_PDISPLAY_CRTC_REAL_RES          0x00610b40
#define NV50_PDISPLAY_UNK30_CTRL             0x00610030
#define NV50_PDISPLAY_UNK30_CTRL_UPDATE_VCLK0 0x00000200
#define NV50_PDISPLAY_UNK30_CTRL_PENDING     0x80000000

static inline void nv_writel(uint32_t reg, uint32_t val)
{
    volatile uint32_t *addr = (volatile uint32_t *)(nvidia_mmio_base + reg);
    *addr = val;
}

static inline uint32_t nv_readl(uint32_t reg)
{
    volatile uint32_t *addr = (volatile uint32_t *)(nvidia_mmio_base + reg);
    return *addr;
}

static void nvidia_program_regs(void)
{
    debug_puts("Nvidia: programming registers\n");
    /* Placeholder for register setup */
}

static void nvidia_set_mode(uint32_t w, uint32_t h)
{
    debug_puts("Nvidia: set display mode ");
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

    uint32_t pitch = fb->pitch | NV50_PDISPLAY_CRTC_FB_PITCH_LINEAR;

    nv_writel(NV50_PDISPLAY_CRTC_REAL_RES, (h << 16) | w);
    nv_writel(NV50_PDISPLAY_CRTC_FB_SIZE,  (h << 16) | w);
    nv_writel(NV50_PDISPLAY_CRTC_FB_PITCH, pitch);
    nv_writel(NV50_PDISPLAY_CRTC_DISPLAY_TOTAL,
              ((h + 45) << 16) | (w + 160));
    nv_writel(NV50_PDISPLAY_CRTC_SYNC_DURATION, (60 << 16) | 1);

    nv_writel(NV50_PDISPLAY_UNK30_CTRL,
              NV50_PDISPLAY_UNK30_CTRL_UPDATE_VCLK0);
    while (nv_readl(NV50_PDISPLAY_UNK30_CTRL) &
           NV50_PDISPLAY_UNK30_CTRL_PENDING)
        ;
}

static int nvidia_enable_vulkan(void)
{
    debug_puts("Nvidia: exposing Vulkan hooks\n");
    return 0;
}

static void nvidia_hw_init(const pci_device_t *dev)
{
    debug_puts("Initializing Nvidia GPU\n");

    uint32_t bar0 = pci_config_read32(dev->bus, dev->slot, dev->func, 0x10);
    uint64_t bar0_phys = (uint64_t)(bar0 & ~0xFULL);
    map_identity_range(bar0_phys, 16 * 1024 * 1024ULL);
    debug_puts("BAR0 mapped at 0x");
    debug_puthex64(bar0_phys);
    debug_putc('\n');

    nvidia_mmio_base = (uintptr_t)bar0_phys;

    init_framebuffer(&boot_info_get()->fb);
    nvidia_program_regs();
    gpu_set_active_driver(&nvidia_driver);
}

static void nvidia_init(void)
{
    if (nvidia_dev)
        nvidia_hw_init(nvidia_dev);
}

static void nvidia_pnp_init(const pci_device_t *dev)
{
    nvidia_dev = dev;
    nvidia_hw_init(dev);
}

gpu_driver_t nvidia_driver = {
    .vendor = GPU_VENDOR_NVIDIA,
    .init = nvidia_init,
    .set_mode = nvidia_set_mode,
    .enable_vulkan = nvidia_enable_vulkan,
};

driver_t nvidia_pnp_driver = {
    .name = "Nvidia GPU",
    .match = nvidia_match,
    .init = nvidia_pnp_init,
};

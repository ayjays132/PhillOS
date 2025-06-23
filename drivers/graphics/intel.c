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

static void intel_program_regs(void)
{
    debug_puts("Intel: programming registers\n");
}

static void intel_set_mode(uint32_t w, uint32_t h)
{
    debug_puts("Intel: set display mode ");
    debug_puthex(w);
    debug_putc('x');
    debug_puthex(h);
    debug_putc('\n');
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
    uint64_t fb = (uint64_t)(bar0 & ~0xFULL);
    map_identity_range(fb, 16 * 1024 * 1024ULL);
    debug_puts("BAR0 mapped at 0x");
    debug_puthex64(fb);
    debug_putc('\n');

    init_framebuffer(&boot_info_get()->fb);
    gpu_set_active_gfx_device(framebuffer_get_gfx_device());
    intel_program_regs();
    gpu_set_active_driver(&intel_driver);
}

static void intel_init(void)
{
    if (intel_dev)
        intel_hw_init(intel_dev);
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

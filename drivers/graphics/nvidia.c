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
    /* TODO: write mode registers */
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
    uint64_t fb = (uint64_t)(bar0 & ~0xFULL);
    map_identity_range(fb, 16 * 1024 * 1024ULL);
    debug_puts("BAR0 mapped at 0x");
    debug_puthex64(fb);
    debug_putc('\n');

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

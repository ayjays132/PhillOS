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

static void nvidia_init(const pci_device_t *dev)
{
    debug_puts("Initializing Nvidia GPU\n");

    uint32_t bar0 = pci_config_read32(dev->bus, dev->slot, dev->func, 0x10);
    uint64_t fb = (uint64_t)(bar0 & ~0xFULL);
    map_identity_range(fb, 16 * 1024 * 1024ULL);
    debug_puts("BAR0 mapped at 0x");
    debug_puthex64(fb);
    debug_putc('\n');

    init_framebuffer(&boot_info_get()->fb);
    gpu_set_active_driver(&nvidia_driver);
}

gpu_driver_t nvidia_driver = {
    .vendor = GPU_VENDOR_NVIDIA,
    .init = NULL,
};

driver_t nvidia_pnp_driver = {
    .name = "Nvidia GPU",
    .match = nvidia_match,
    .init = nvidia_init,
};

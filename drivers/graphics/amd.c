#include "amd.h"
#include "framebuffer.h"
#include "../../kernel/memory/paging.h"
#include "../../kernel/debug.h"
#include "../../kernel/init.h"
#include "../driver_manager.h"

static int amd_match(const pci_device_t *dev)
{
    return dev->vendor_id == 0x1002 && dev->class_code == 0x03;
}

static const pci_device_t *amd_dev = NULL;

static void amd_hw_init(const pci_device_t *dev)
{
    debug_puts("Initializing AMD GPU\n");

    uint32_t bar2 = pci_config_read32(dev->bus, dev->slot, dev->func, 0x18);
    uint64_t fb = (uint64_t)(bar2 & ~0xFULL);
    map_identity_range(fb, 16 * 1024 * 1024ULL);
    debug_puts("BAR2 mapped at 0x");
    debug_puthex64(fb);
    debug_putc('\n');

    init_framebuffer(&boot_info_get()->fb);
    gpu_set_active_driver(&amd_driver);
}

static void amd_init(void)
{
    if (amd_dev)
        amd_hw_init(amd_dev);
}

static void amd_pnp_init(const pci_device_t *dev)
{
    amd_dev = dev;
    amd_hw_init(dev);
}

gpu_driver_t amd_driver = {
    .vendor = GPU_VENDOR_AMD,
    .init = amd_init,
};

driver_t amd_pnp_driver = {
    .name = "AMD GPU",
    .match = amd_match,
    .init = amd_pnp_init,
};

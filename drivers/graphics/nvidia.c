#include "nvidia.h"
#include "framebuffer.h"
#include "../../kernel/memory/paging.h"
#include "../../kernel/debug.h"
#include "../../kernel/init.h"
#include <stdint.h>

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

static void nvidia_init_stub(void)
{
    debug_puts("Initializing Nvidia GPU\n");
    for (uint8_t bus = 0; bus < 256; bus++) {
        for (uint8_t slot = 0; slot < 32; slot++) {
            uint32_t venddev = pci_read32(bus, slot, 0, 0);
            uint16_t vendor = venddev & 0xFFFF;
            if (vendor != 0x10DE)
                continue;

            uint16_t device = venddev >> 16;
            debug_puts("Found Nvidia device 0x");
            debug_puthex(device);
            debug_puts(" at ");
            debug_puthex(bus);
            debug_putc(':');
            debug_puthex(slot);
            debug_putc('\n');

            uint32_t bar0 = pci_read32(bus, slot, 0, 0x10);
            uint64_t fb = (uint64_t)(bar0 & ~0xFULL);
            map_identity_range(fb, 16 * 1024 * 1024ULL);
            debug_puts("BAR0 mapped at 0x");
            debug_puthex64(fb);
            debug_putc('\n');

            gpu_set_active_driver(&nvidia_driver);
            init_framebuffer(&boot_info_get()->fb);
            return;
        }
    }
    debug_puts("No Nvidia GPU found\n");
}

static int nvidia_probe(void)
{
    for (uint8_t bus = 0; bus < 256; bus++) {
        for (uint8_t slot = 0; slot < 32; slot++) {
            uint32_t venddev = pci_read32(bus, slot, 0, 0);
            if ((venddev & 0xFFFF) == 0x10DE)
                return 1;
        }
    }
    return 0;
}

gpu_driver_t nvidia_driver = {
    .base = {
        .probe = nvidia_probe,
        .init = nvidia_init_stub,
        .next = NULL,
    },
    .vendor = GPU_VENDOR_NVIDIA,
};

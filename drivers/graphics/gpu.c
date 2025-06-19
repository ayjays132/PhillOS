#include "gpu.h"

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

/* Scan PCI bus for Nvidia or AMD GPUs */
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
        }
    }
    return GPU_VENDOR_UNKNOWN;
}

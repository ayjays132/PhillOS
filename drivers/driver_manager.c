#include "driver_manager.h"
#include "../kernel/debug.h"

static driver_t *driver_list = NULL;

void driver_manager_register(driver_t *drv)
{
    drv->next = driver_list;
    driver_list = drv;
}

void driver_manager_unregister(driver_t *drv)
{
    driver_t **indirect = &driver_list;
    while (*indirect) {
        if (*indirect == drv) {
            *indirect = drv->next;
            drv->next = NULL;
            return;
        }
        indirect = &(*indirect)->next;
    }
}

uint32_t pci_config_read32(uint8_t bus, uint8_t slot, uint8_t func, uint8_t offset)
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

static void pci_scan(void)
{
    for (uint8_t bus = 0; bus < 256; bus++) {
        for (uint8_t slot = 0; slot < 32; slot++) {
            for (uint8_t func = 0; func < 8; func++) {
                uint32_t venddev = pci_config_read32(bus, slot, func, 0);
                uint16_t vendor = venddev & 0xFFFF;
                if (vendor == 0xFFFF)
                    continue;
                uint16_t device = venddev >> 16;
                uint32_t classcode = pci_config_read32(bus, slot, func, 8);
                pci_device_t dev = {
                    .bus = bus,
                    .slot = slot,
                    .func = func,
                    .vendor_id = vendor,
                    .device_id = device,
                    .class_code = (classcode >> 24) & 0xFF,
                    .subclass = (classcode >> 16) & 0xFF,
                };
                for (driver_t *d = driver_list; d; d = d->next) {
                    if (!d->match || d->match(&dev)) {
                        debug_puts("PnP init: ");
                        debug_puts(d->name);
                        debug_putc('\n');
                        if (d->init)
                            d->init(&dev);
                    }
                }
            }
        }
    }
}

void driver_manager_init(void)
{
    pci_scan();
}

void driver_manager_rescan(void)
{
    pci_scan();
}

#include "driver_manager.h"
#include "../kernel/debug.h"
#include "../kernel/modules/modules.h"

static driver_t *driver_list = NULL;

typedef struct {
    uint8_t bus, slot, func;
    uint16_t vendor, device;
    uint8_t class_code, subclass;
    int present;
    driver_t *driver;
    module_t *module;
} device_record_t;

#define MAX_DEVICES 64
static device_record_t devices[MAX_DEVICES];
static unsigned device_count = 0;

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

static device_record_t *find_record(uint8_t bus, uint8_t slot, uint8_t func)
{
    for (unsigned i = 0; i < device_count; i++) {
        if (devices[i].bus == bus && devices[i].slot == slot && devices[i].func == func)
            return &devices[i];
    }
    return NULL;
}

static void remove_record(device_record_t *rec)
{
    if (rec->module)
        module_unload(rec->module);
    else if (rec->driver)
        driver_manager_unregister(rec->driver);

    unsigned idx = rec - devices;
    if (idx < device_count - 1)
        devices[idx] = devices[device_count - 1];
    device_count--;
}

static void handle_new_device(const pci_device_t *dev)
{
    if (device_count >= MAX_DEVICES)
        return;

    device_record_t *rec = &devices[device_count++];
    memset(rec, 0, sizeof(*rec));
    rec->bus = dev->bus;
    rec->slot = dev->slot;
    rec->func = dev->func;
    rec->vendor = dev->vendor_id;
    rec->device = dev->device_id;
    rec->class_code = dev->class_code;
    rec->subclass = dev->subclass;
    rec->present = 1;

    for (driver_t *d = driver_list; d; d = d->next) {
        if (!d->match || d->match(dev)) {
            debug_puts("PnP init: ");
            debug_puts(d->name);
            debug_putc('\n');
            if (d->init)
                d->init(dev);
            rec->driver = d;
            return;
        }
    }

    char path[32];
    debug_puts("Loading module for vendor 0x");
    debug_puthex(dev->vendor_id);
    debug_puts(" device 0x");
    debug_puthex(dev->device_id);
    debug_putc('\n');
    const char hex[] = "0123456789abcdef";
    int idx = 0;
    const char *pre = "/modules/";
    while (pre[idx]) { path[idx] = pre[idx]; idx++; }
    path[idx++] = hex[(dev->vendor_id >> 12) & 0xF];
    path[idx++] = hex[(dev->vendor_id >> 8) & 0xF];
    path[idx++] = hex[(dev->vendor_id >> 4) & 0xF];
    path[idx++] = hex[dev->vendor_id & 0xF];
    path[idx++] = '_';
    path[idx++] = hex[(dev->device_id >> 12) & 0xF];
    path[idx++] = hex[(dev->device_id >> 8) & 0xF];
    path[idx++] = hex[(dev->device_id >> 4) & 0xF];
    path[idx++] = hex[dev->device_id & 0xF];
    path[idx++] = '.'; path[idx++] = 'k'; path[idx++] = 'o';
    path[idx] = '\0';
    module_t *mod = module_load(path);
    if (mod && mod->driver) {
        driver_t *drv = mod->driver;
        if (!drv->match || drv->match(dev)) {
            if (drv->init)
                drv->init(dev);
            rec->driver = drv;
            rec->module = mod;
            return;
        }
        module_unload(mod);
    }
}

static void pci_scan_changes(void)
{
    for (unsigned i = 0; i < device_count; i++)
        devices[i].present = 0;

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

                device_record_t *rec = find_record(bus, slot, func);
                if (rec) {
                    rec->present = 1;
                } else {
                    handle_new_device(&dev);
                }
            }
        }
    }

    for (unsigned i = 0; i < device_count; ) {
        if (!devices[i].present)
            remove_record(&devices[i]);
        else
            i++;
    }
}

void driver_manager_init(void)
{
    device_count = 0;
    pci_scan_changes();
}

void driver_manager_rescan(void)
{
    pci_scan_changes();
}

void driver_manager_unload(uint8_t bus, uint8_t slot, uint8_t func)
{
    device_record_t *rec = find_record(bus, slot, func);
    if (rec)
        remove_record(rec);
}

void driver_manager_poll(void)
{
    pci_scan_changes();
}

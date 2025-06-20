#ifndef PHILLOS_DRIVER_MANAGER_H
#define PHILLOS_DRIVER_MANAGER_H

#include <stdint.h>
#include <phillos/driver/IDriverManager.h>
#include <phillos/driver/IHotSwapListener.h>

typedef struct pci_device {
    uint8_t bus;
    uint8_t slot;
    uint8_t func;
    uint16_t vendor_id;
    uint16_t device_id;
    uint8_t class_code;
    uint8_t subclass;
} pci_device_t;

typedef struct driver {
    const char *name;
    int (*match)(const pci_device_t *dev);
    void (*init)(const pci_device_t *dev);
    struct driver *next;
} driver_t;

void driver_manager_register(driver_t *drv);
void driver_manager_unregister(driver_t *drv);
void driver_manager_init(void);
void driver_manager_rescan(void);
void driver_manager_unload(uint8_t bus, uint8_t slot, uint8_t func);
void driver_manager_poll(void);
uint32_t pci_config_read32(uint8_t bus, uint8_t slot, uint8_t func, uint8_t offset);

void driver_manager_add_listener(IHotSwapListener *listener);
void driver_manager_remove_listener(IHotSwapListener *listener);

extern const IDriverManager driver_manager;

#endif // PHILLOS_DRIVER_MANAGER_H

#ifndef PHILLOS_AHCI_H
#define PHILLOS_AHCI_H

#include <stdint.h>

void init_ahci(void);
int ahci_read(uint64_t lba, uint32_t count, void *buffer);
int ahci_write(uint64_t lba, uint32_t count, const void *buffer);

#include "../driver_manager.h"
extern driver_t ahci_pnp_driver;

#endif // PHILLOS_AHCI_H

#ifndef PHILLOS_AHCI_H
#define PHILLOS_AHCI_H

#include <stdint.h>
#include "../driver.h"

int init_ahci(void);
extern driver_t ahci_driver;
int ahci_read(uint64_t lba, uint32_t count, void *buffer);
int ahci_write(uint64_t lba, uint32_t count, const void *buffer);

#endif // PHILLOS_AHCI_H

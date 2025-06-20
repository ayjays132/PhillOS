#ifndef PHILLOS_BLUETOOTH_H
#define PHILLOS_BLUETOOTH_H

void init_bluetooth(void);
int bluetooth_is_up(void);
int bluetooth_start_pairing(const char *name);

#include "../driver_manager.h"
extern driver_t bluetooth_pnp_driver;

#endif // PHILLOS_BLUETOOTH_H

#ifndef PHILLOS_OFFLINE_H
#define PHILLOS_OFFLINE_H

#include "boot_info.h"

void offline_init(boot_info_t *info);
int offline_is_enabled(void);
void offline_set(int enabled);
void offline_reload_cfg(void);

#endif // PHILLOS_OFFLINE_H

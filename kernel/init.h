#ifndef PHILLOS_INIT_H
#define PHILLOS_INIT_H

#include "boot_info.h"

void kernel_main(boot_info_t *boot_info);
boot_info_t *boot_info_get(void);

#endif // PHILLOS_INIT_H

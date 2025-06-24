#ifndef PHILLOS_ALLOC_H
#define PHILLOS_ALLOC_H

#include "../boot_info.h"

void init_physical_memory(boot_info_t *boot_info);
void* alloc_page(void);
void free_page(void* page);

#endif // PHILLOS_ALLOC_H

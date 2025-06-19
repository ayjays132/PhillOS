#ifndef PHILLOS_PAGING_H
#define PHILLOS_PAGING_H

#include <stdint.h>

#define PAGE_PRESENT 0x1ULL
#define PAGE_WRITE   0x2ULL

void init_paging(void);

#endif // PHILLOS_PAGING_H

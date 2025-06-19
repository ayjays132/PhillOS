#ifndef PHILLOS_PAGING_H
#define PHILLOS_PAGING_H

#include <stdint.h>

#define PAGE_PRESENT 0x1ULL
#define PAGE_WRITE   0x2ULL

void init_paging(void);
void map_identity_range(uint64_t phys_addr, uint64_t size);

#endif // PHILLOS_PAGING_H

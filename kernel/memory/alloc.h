#ifndef PHILLOS_ALLOC_H
#define PHILLOS_ALLOC_H

void init_physical_memory(void);
void* alloc_page(void);
void free_page(void* page);

#endif // PHILLOS_ALLOC_H

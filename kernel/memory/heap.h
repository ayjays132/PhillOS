#ifndef PHILLOS_HEAP_H
#define PHILLOS_HEAP_H

#include <stddef.h>

void init_heap(void);
void *kmalloc(size_t size);
void kfree(void *ptr);

#endif // PHILLOS_HEAP_H

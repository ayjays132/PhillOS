#ifndef PHILLOS_HEAP_H
#define PHILLOS_HEAP_H

#include <stddef.h>

void init_heap(void);
void init_ai_heap(void *base, size_t size);
void *kmalloc(size_t size);
void *ai_malloc(size_t size);
void kfree(void *ptr);
void ai_free(void *ptr);

#endif // PHILLOS_HEAP_H

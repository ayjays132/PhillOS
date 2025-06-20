#ifndef PHILLOS_HEAP_H
#define PHILLOS_HEAP_H

#include <stddef.h>

// Number of 4KiB pages reserved for the agent subsystem
#define AGENT_MEMORY_PAGES 4

void init_heap(void);
void init_ai_heap(void *base, size_t size);
void *kmalloc(size_t size);
void *ai_malloc(size_t size);
void kfree(void *ptr);
void ai_free(void *ptr);
void *agent_alloc(size_t size);
void agent_free(void *ptr);

size_t heap_usage(void);
size_t agent_heap_usage(void);

#endif // PHILLOS_HEAP_H

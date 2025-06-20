#include "heap.h"
#include "alloc.h"
#include <stddef.h>
#include <stdint.h>
#include <string.h>

typedef struct heap_block {
    size_t size;
    struct heap_block *next;
    int free;
} heap_block_t;

static heap_block_t *heap_head = NULL;
static heap_block_t *ai_heap_head = NULL;
static heap_block_t *agent_heap_head = NULL;

static void split_block(heap_block_t *blk, size_t size);

static void *alloc_new_page(void)
{
    void *page = alloc_page();
    if (!page)
        return NULL;
    heap_block_t *blk = (heap_block_t *)page;
    blk->size = 4096 - sizeof(heap_block_t);
    blk->next = NULL;
    blk->free = 1;
    return blk;
}

static void init_heap_region(void *base, size_t size, heap_block_t **head)
{
    if (!base || size <= sizeof(heap_block_t))
        return;
    heap_block_t *blk = (heap_block_t *)base;
    blk->size = size - sizeof(heap_block_t);
    blk->next = NULL;
    blk->free = 1;
    *head = blk;
}

void init_heap(void)
{
    heap_head = alloc_new_page();
    agent_heap_head = NULL;
    heap_block_t *prev = NULL;
    for (size_t i = 0; i < AGENT_MEMORY_PAGES; i++) {
        heap_block_t *blk = alloc_new_page();
        if (!blk)
            break;
        if (!agent_heap_head)
            agent_heap_head = blk;
        if (prev)
            prev->next = blk;
        prev = blk;
    }
}

void init_ai_heap(void *base, size_t size)
{
    init_heap_region(base, size, &ai_heap_head);
}

static void *heap_alloc(heap_block_t **head, size_t size, int grow)
{
    if (!size)
        return NULL;
    size = (size + 7) & ~7UL;
    heap_block_t *blk = *head;
    heap_block_t *prev = NULL;
    while (blk) {
        if (blk->free && blk->size >= size) {
            split_block(blk, size);
            blk->free = 0;
            return (uint8_t *)blk + sizeof(heap_block_t);
        }
        prev = blk;
        blk = blk->next;
    }
    if (!grow)
        return NULL;
    heap_block_t *new_blk = alloc_new_page();
    if (!new_blk)
        return NULL;
    if (prev)
        prev->next = new_blk;
    else
        *head = new_blk;
    if (new_blk->size >= size) {
        split_block(new_blk, size);
        new_blk->free = 0;
        return (uint8_t *)new_blk + sizeof(heap_block_t);
    }
    return NULL;
}

static void split_block(heap_block_t *blk, size_t size)
{
    if (blk->size <= size + sizeof(heap_block_t))
        return;
    heap_block_t *new_blk = (heap_block_t *)((uint8_t *)blk + sizeof(heap_block_t) + size);
    new_blk->size = blk->size - size - sizeof(heap_block_t);
    new_blk->next = blk->next;
    new_blk->free = 1;
    blk->size = size;
    blk->next = new_blk;
}

void *kmalloc(size_t size)
{
    return heap_alloc(&heap_head, size, 1);
}

void *ai_malloc(size_t size)
{
    return heap_alloc(&ai_heap_head, size, 0);
}

static void merge_next(heap_block_t *blk)
{
    heap_block_t *next = blk->next;
    if (next && next->free &&
        (uint8_t *)blk + sizeof(heap_block_t) + blk->size == (uint8_t *)next) {
        blk->size += sizeof(heap_block_t) + next->size;
        blk->next = next->next;
    }
}

static void heap_free(heap_block_t **head, void *ptr)
{
    if (!ptr)
        return;
    heap_block_t *blk = (heap_block_t *)((uint8_t *)ptr - sizeof(heap_block_t));
    blk->free = 1;
    merge_next(blk);
    heap_block_t *iter = *head;
    while (iter && iter->next && iter->next != blk)
        iter = iter->next;
    if (iter && iter->next == blk && iter->free)
        merge_next(iter);
}

void kfree(void *ptr)
{
    heap_free(&heap_head, ptr);
}

void ai_free(void *ptr)
{
    heap_free(&ai_heap_head, ptr);
}

void *agent_alloc(size_t size)
{
    return heap_alloc(&agent_heap_head, size, 0);
}

void agent_free(void *ptr)
{
    heap_free(&agent_heap_head, ptr);
}

size_t heap_usage(void)
{
    size_t used = 0;
    heap_block_t *blk = heap_head;
    while (blk) {
        if (!blk->free)
            used += blk->size;
        blk = blk->next;
    }
    return used;
}


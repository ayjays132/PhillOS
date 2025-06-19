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

void init_heap(void)
{
    heap_head = alloc_new_page();
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
    if (!size)
        return NULL;
    size = (size + 7) & ~7UL; // align to 8 bytes
    heap_block_t *blk = heap_head;
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
    // no suitable block, allocate new page
    heap_block_t *new_blk = alloc_new_page();
    if (!new_blk)
        return NULL;
    if (prev)
        prev->next = new_blk;
    else
        heap_head = new_blk;
    if (new_blk->size >= size) {
        split_block(new_blk, size);
        new_blk->free = 0;
        return (uint8_t *)new_blk + sizeof(heap_block_t);
    }
    // not enough even after a new page (should not happen)
    return NULL;
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

void kfree(void *ptr)
{
    if (!ptr)
        return;
    heap_block_t *blk = (heap_block_t *)((uint8_t *)ptr - sizeof(heap_block_t));
    blk->free = 1;
    merge_next(blk);
    // try to merge with previous
    heap_block_t *iter = heap_head;
    while (iter && iter->next && iter->next != blk)
        iter = iter->next;
    if (iter && iter->next == blk && iter->free)
        merge_next(iter);
}

#include "../../kernel/boot_info.h"
#include "../../kernel/memory/alloc.h"
#include "../../kernel/memory/heap.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void)
{
    const int pages = 16;
    void *mem = malloc(pages * 4096);
    if (!mem) {
        fprintf(stderr, "memory allocation failed\n");
        return 1;
    }
    memset(mem, 0, pages * 4096);

    efi_memory_descriptor_t desc = {0};
    desc.Type = 7; /* EfiConventionalMemory */
    desc.PhysicalStart = (uint64_t)mem;
    desc.NumberOfPages = pages;

    boot_info_t bi = {0};
    bi.mmap_size = sizeof(desc);
    bi.mmap_desc_size = sizeof(desc);
    bi.mmap = &desc;

    init_physical_memory(&bi);
    init_heap();

    void *a = kmalloc(100);
    void *b = kmalloc(200);
    if (!a || !b) {
        fprintf(stderr, "kmalloc failed\n");
        return 1;
    }

    size_t used = heap_usage();
    if (used != 304) {
        fprintf(stderr, "unexpected usage after allocs: %zu\n", used);
        return 1;
    }

    kfree(a);
    used = heap_usage();
    if (used != 200) {
        fprintf(stderr, "unexpected usage after first free: %zu\n", used);
        return 1;
    }

    kfree(b);
    used = heap_usage();
    if (used != 0) {
        fprintf(stderr, "unexpected usage after second free: %zu\n", used);
        return 1;
    }

    free(mem);
    printf("kernel memory tests passed\n");
    return 0;
}

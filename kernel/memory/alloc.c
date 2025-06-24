#include "alloc.h"
#include "../boot_info.h"

// Simple stack of free 4KiB pages. Each free page stores the pointer to the
// next page at its beginning. This uses the UEFI memory map to populate the
// stack with all pages marked as EfiConventionalMemory.

static void *free_list_head = NULL;

static void push_page(void *page) {
    *(void **)page = free_list_head;
    free_list_head = page;
}

static void *pop_page(void) {
    if (!free_list_head)
        return NULL;
    void *page = free_list_head;
    free_list_head = *(void **)page;
    return page;
}

void init_physical_memory(boot_info_t *boot_info) {
    if (!boot_info)
        return;

    uint8_t *mem_map = (uint8_t *)boot_info->mmap;
    uint64_t map_size = boot_info->mmap_size;
    uint64_t desc_size = boot_info->mmap_desc_size;

    for (uint64_t offset = 0; offset < map_size; offset += desc_size) {
        efi_memory_descriptor_t *desc =
            (efi_memory_descriptor_t *)(mem_map + offset);

        if (desc->Type != 7) /* EfiConventionalMemory */
            continue;

        uint64_t addr = desc->PhysicalStart;
        for (uint64_t i = 0; i < desc->NumberOfPages; i++) {
            push_page((void *)(addr + i * 4096));
        }
    }
}

void* alloc_page(void) {
    return pop_page();
}

void free_page(void* page) {
    if (page)
        push_page(page);
}

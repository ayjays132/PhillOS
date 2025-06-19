#include "alloc.h"
#include <efi.h>
#include <efilib.h>

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

void init_physical_memory(void) {
    EFI_STATUS status;
    EFI_MEMORY_DESCRIPTOR *mem_map = NULL;
    UINTN map_size = 0, map_key, desc_size;
    UINT32 desc_ver;

    // Query size of the memory map
    status = ST->BootServices->GetMemoryMap(&map_size, mem_map, &map_key,
                                            &desc_size, &desc_ver);
    if (status != EFI_BUFFER_TOO_SMALL)
        return; // Unable to obtain size

    // Allocate buffer for memory map
    map_size += desc_size * 8; // Some slack for new allocations
    status = ST->BootServices->AllocatePool(EfiLoaderData, map_size,
                                            (void **)&mem_map);
    if (EFI_ERROR(status))
        return;

    // Retrieve the memory map
    status = ST->BootServices->GetMemoryMap(&map_size, mem_map, &map_key,
                                            &desc_size, &desc_ver);
    if (EFI_ERROR(status)) {
        ST->BootServices->FreePool(mem_map);
        return;
    }

    // Walk descriptors and push conventional memory pages on the stack
    for (UINTN offset = 0; offset < map_size; offset += desc_size) {
        EFI_MEMORY_DESCRIPTOR *desc =
            (EFI_MEMORY_DESCRIPTOR *)((UINT8 *)mem_map + offset);

        if (desc->Type != EfiConventionalMemory)
            continue;

        UINT64 addr = desc->PhysicalStart;
        for (UINTN i = 0; i < desc->NumberOfPages; i++) {
            push_page((void *)(addr + i * 4096));
        }
    }

    ST->BootServices->FreePool(mem_map);
}

void* alloc_page(void) {
    return pop_page();
}

void free_page(void* page) {
    if (page)
        push_page(page);
}

#include "paging.h"
#include "alloc.h"
#include <efi.h>
#include <efilib.h>
#include <string.h>

#define ENTRIES_PER_TABLE 512
#define PAGE_FLAGS (PAGE_PRESENT | PAGE_WRITE)

static inline void zero_page(void *page) {
    memset(page, 0, 4096);
}

void init_paging(void) {
    // Allocate the top level tables
    uint64_t *pml4 = alloc_page();
    uint64_t *pdpt = alloc_page();
    uint64_t *pd   = alloc_page();

    if (!pml4 || !pdpt || !pd)
        return;

    zero_page(pml4);
    zero_page(pdpt);
    zero_page(pd);

    // Link top level tables
    pml4[0] = (uint64_t)pdpt | PAGE_FLAGS;
    pdpt[0] = (uint64_t)pd   | PAGE_FLAGS;

    // Map the first 1 GiB of physical memory using identity mapping
    for (size_t pd_index = 0; pd_index < ENTRIES_PER_TABLE; pd_index++) {
        uint64_t *pt = alloc_page();
        if (!pt)
            return;

        zero_page(pt);

        for (size_t pt_index = 0; pt_index < ENTRIES_PER_TABLE; pt_index++) {
            uint64_t addr = ((uint64_t)pd_index * ENTRIES_PER_TABLE + pt_index) * 4096ULL;
            pt[pt_index] = addr | PAGE_FLAGS;
        }

        pd[pd_index] = (uint64_t)pt | PAGE_FLAGS;
    }

    // Load new page tables
    __asm__ volatile("mov %0, %%cr3" :: "r"(pml4) : "memory");
}

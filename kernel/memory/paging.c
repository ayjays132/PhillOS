#include "paging.h"
#include "alloc.h"
#include <efi.h>
#include <efilib.h>
#include <string.h>

#define ENTRIES_PER_TABLE 512
#define PAGE_FLAGS (PAGE_PRESENT | PAGE_WRITE)

static uint64_t *kernel_pml4 = NULL;

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

    kernel_pml4 = pml4;
    // Load new page tables
    __asm__ volatile("mov %0, %%cr3" :: "r"(pml4) : "memory");
}

static uint64_t *get_or_alloc_table(uint64_t *table, size_t index)
{
    if (!(table[index] & PAGE_PRESENT)) {
        uint64_t *new_table = alloc_page();
        if (!new_table)
            return NULL;
        zero_page(new_table);
        table[index] = (uint64_t)new_table | PAGE_FLAGS;
    }
    return (uint64_t *)(table[index] & ~0xFFFULL);
}

void map_identity_range(uint64_t phys_addr, uint64_t size)
{
    uint64_t addr = phys_addr & ~0xFFFULL;
    uint64_t end  = (phys_addr + size + 4095) & ~0xFFFULL;

    for (; addr < end; addr += 4096) {
        size_t pml4_i = (addr >> 39) & 0x1FF;
        size_t pdpt_i = (addr >> 30) & 0x1FF;
        size_t pd_i   = (addr >> 21) & 0x1FF;
        size_t pt_i   = (addr >> 12) & 0x1FF;

        uint64_t *pdpt = get_or_alloc_table(kernel_pml4, pml4_i);
        if (!pdpt) return;
        uint64_t *pd = get_or_alloc_table(pdpt, pdpt_i);
        if (!pd) return;
        uint64_t *pt = get_or_alloc_table(pd, pd_i);
        if (!pt) return;

        pt[pt_i] = addr | PAGE_FLAGS;
    }
}

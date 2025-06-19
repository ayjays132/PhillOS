#include "init.h"
#include "memory/paging.h"
#include "memory/alloc.h"
#include "../drivers/storage/ahci.h"

void kernel_main(void) {
    // Placeholder for kernel initialization logic
    init_physical_memory();
    init_paging();
    init_ahci();
    // Kernel is now initialized
    while (1) {
        // Halt CPU to prevent exiting
        __asm__("hlt");
    }
}

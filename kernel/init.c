#include "init.h"
#include "memory/paging.h"
#include "memory/alloc.h"
#include "../drivers/storage/ahci.h"
#include "../drivers/graphics/framebuffer.h"

void kernel_main(void) {
    // Placeholder for kernel initialization logic
    init_physical_memory();
    init_framebuffer();
    init_paging();
    init_ahci();
    fb_draw_pixel(10, 10, 0x00FF0000); // draw red pixel for debug
    // Kernel is now initialized
    while (1) {
        // Halt CPU to prevent exiting
        __asm__("hlt");
    }
}

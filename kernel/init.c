#include "init.h"
#include "boot_info.h"
#include "memory/paging.h"
#include "memory/alloc.h"
#include "memory/heap.h"
#include "../drivers/storage/ahci.h"
#include "fs/fat32.h"
#include "../drivers/graphics/framebuffer.h"
#include "../drivers/graphics/gpu.h"
#include "../drivers/driver_manager.h"
#include "../drivers/register.h"

static boot_info_t *g_boot_info = NULL;

boot_info_t *boot_info_get(void)
{
    return g_boot_info;
}

void kernel_main(boot_info_t *boot_info) {
    g_boot_info = boot_info;
    // Placeholder for kernel initialization logic
    init_physical_memory(boot_info);
    init_paging();
    init_heap();
    if (boot_info->ai_size)
        init_ai_heap((void *)boot_info->ai_base, boot_info->ai_size);
    drivers_register_all();
    driver_manager_init();
    fat32_init();
    init_framebuffer(&boot_info->fb);
    fb_draw_pixel(10, 10, 0x00FF0000); // draw red pixel for debug
    // Kernel is now initialized
    while (1) {
        // Halt CPU to prevent exiting
        __asm__("hlt");
    }
}

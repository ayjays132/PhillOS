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
#include "offline.h"
#include "theme.h"
#include "display.h"
#include "scheduler/uhs.h"
#include "scheduler/chaos_sched.h"

static boot_info_t *g_boot_info = NULL;
static chaos_sched_t g_sched;

int schedule_resources(const float *A, const float *B,
                       const float *R_tot, size_t N, size_t M, size_t R,
                       float *out_x)
{
    return uhs_compute(A, B, R_tot, N, M, R, out_x);
}

boot_info_t *boot_info_get(void)
{
    return g_boot_info;
}

size_t sched_task_count(void)
{
    return g_sched.count;
}

float sched_last_residual(void)
{
    return uhs_last_residual();
}

void kernel_main(boot_info_t *boot_info) {
    g_boot_info = boot_info;
    offline_init(boot_info);
    theme_init(boot_info->theme_dark);
    // Placeholder for kernel initialization logic
    init_physical_memory(boot_info);
    init_paging();
    init_heap();
    if (boot_info->ai_size)
        init_ai_heap((void *)boot_info->ai_base, boot_info->ai_size);
    drivers_register_all();
    fat32_init();
    offline_reload_cfg();
    theme_reload_cfg();
    gpu_reload_cfg();
    display_reload_cfg();
    driver_manager_init();
    init_framebuffer(&boot_info->fb);
    fb_clear(theme_is_dark() ? 0x00000000 : 0x00FFFFFF);
    fb_fill_rect(20, 20, 100, 60, 0x0000FF00); // simple boot banner
    if (offline_is_enabled())
        fb_draw_text(24, 24, "OFFLINE MODE", 0x00FFFFFF, 0x00000000);
    else
        fb_draw_text(24, 24, "ONLINE MODE", 0x00FFFFFF, 0x00000000);
    chaos_sched_init(&g_sched, 0.01f, 0.005f, 0.1f, 0.1f);
    chaos_sched_add(&g_sched, 0);
    // Kernel is now initialized
    while (1) {
        driver_manager_poll();
        chaos_sched_step(&g_sched);
        float slices[CHAOS_MAX_TASKS];
        chaos_sched_slices(&g_sched, slices, CHAOS_MAX_TASKS);
        __asm__("hlt");
    }
}

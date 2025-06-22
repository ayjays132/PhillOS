#ifndef PHILLOS_GPU_H
#define PHILLOS_GPU_H

#include <stdint.h>
#include "../../kernel/boot_info.h"

typedef struct {
    gpu_vendor_t vendor;
    void (*init)(void);
    void (*set_mode)(uint32_t width, uint32_t height);
    int  (*enable_vulkan)(void);
} gpu_driver_t;

gpu_vendor_t detect_gpu_vendor(void);
void init_gpu_driver(void);
gpu_driver_t *gpu_get_active_driver(void);
void gpu_set_active_driver(gpu_driver_t *drv);
void gpu_reload_cfg(void);

#endif // PHILLOS_GPU_H

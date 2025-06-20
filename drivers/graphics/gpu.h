#ifndef PHILLOS_GPU_H
#define PHILLOS_GPU_H

#include <stdint.h>
#include "../driver.h"

typedef enum {
    GPU_VENDOR_UNKNOWN = 0,
    GPU_VENDOR_NVIDIA,
    GPU_VENDOR_AMD,
    GPU_VENDOR_INTEL
} gpu_vendor_t;

typedef struct gpu_driver {
    driver_t base;
    gpu_vendor_t vendor;
} gpu_driver_t;

gpu_vendor_t detect_gpu_vendor(void);
void init_gpu_driver(void);
gpu_driver_t *gpu_get_active_driver(void);
void gpu_set_active_driver(gpu_driver_t *drv);

#endif // PHILLOS_GPU_H

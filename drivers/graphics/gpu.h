#ifndef PHILLOS_GPU_H
#define PHILLOS_GPU_H

#include <stdint.h>

typedef enum {
    GPU_VENDOR_UNKNOWN = 0,
    GPU_VENDOR_NVIDIA,
    GPU_VENDOR_AMD
} gpu_vendor_t;

gpu_vendor_t detect_gpu_vendor(void);

#endif // PHILLOS_GPU_H

#include "nvidia.h"

static void nvidia_init_stub(void)
{
    /* Placeholder for Nvidia driver initialization */
}

gpu_driver_t nvidia_driver = {
    .vendor = GPU_VENDOR_NVIDIA,
    .init = nvidia_init_stub,
};

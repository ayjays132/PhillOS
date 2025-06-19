#include "amd.h"

static void amd_init_stub(void)
{
    /* Placeholder for AMD driver initialization */
}

gpu_driver_t amd_driver = {
    .vendor = GPU_VENDOR_AMD,
    .init = amd_init_stub,
};

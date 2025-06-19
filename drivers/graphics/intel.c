#include "intel.h"

static void intel_init_stub(void)
{
    /* Placeholder for Intel driver initialization */
}

gpu_driver_t intel_driver = {
    .vendor = GPU_VENDOR_INTEL,
    .init = intel_init_stub,
};

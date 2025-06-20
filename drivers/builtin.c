#include "driver.h"
#include "graphics/nvidia.h"
#include "graphics/amd.h"
#include "graphics/intel.h"
#include "graphics/gpu.h"
#include "storage/ahci.h"

extern gpu_driver_t nvidia_driver;
extern gpu_driver_t amd_driver;
extern gpu_driver_t intel_driver;
extern driver_t ahci_driver;

void register_builtin_drivers(void)
{
    driver_register((driver_t *)&nvidia_driver);
    driver_register((driver_t *)&amd_driver);
    driver_register((driver_t *)&intel_driver);
    driver_register((driver_t *)&ahci_driver);
}

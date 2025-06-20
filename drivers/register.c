#include "driver_manager.h"
#include "graphics/nvidia.h"
#include "graphics/amd.h"
#include "graphics/intel.h"
#include "storage/ahci.h"
#include "phone/bluetooth.h"
#include "phone/sim.h"
#include "query_dev.h"

extern driver_t nvidia_pnp_driver;
extern driver_t amd_pnp_driver;
extern driver_t intel_pnp_driver;
extern driver_t ahci_pnp_driver;
extern driver_t bluetooth_pnp_driver;
extern driver_t sim_pnp_driver;

void drivers_register_all(void)
{
    driver_manager_register(&nvidia_pnp_driver);
    driver_manager_register(&amd_pnp_driver);
    driver_manager_register(&intel_pnp_driver);
    driver_manager_register(&ahci_pnp_driver);
    driver_manager_register(&bluetooth_pnp_driver);
    driver_manager_register(&sim_pnp_driver);
    query_dev_register();
}

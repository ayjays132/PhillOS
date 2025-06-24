#ifndef PHILLOS_IDRIVERMANAGER_H
#define PHILLOS_IDRIVERMANAGER_H

#include <stdint.h>
#include "IDevice.h"
#include "IHotSwapListener.h"

#ifdef __cplusplus
extern "C" {
#endif

struct driver;

typedef struct IDriverManager {
    void (*register_driver)(struct driver *drv);
    void (*unregister_driver)(struct driver *drv);
    void (*init)(void);
    void (*rescan)(void);
    void (*unload)(uint8_t bus, uint8_t slot, uint8_t func);
    void (*poll)(void);
    void (*add_hot_swap_listener)(IHotSwapListener *listener);
    void (*remove_hot_swap_listener)(IHotSwapListener *listener);
} IDriverManager;

#ifdef __cplusplus
}
#endif

#endif // PHILLOS_IDRIVERMANAGER_H

#ifndef PHILLOS_IHOTSWAPLISTENER_H
#define PHILLOS_IHOTSWAPLISTENER_H

#include "IDevice.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef struct IHotSwapListener {
    void (*device_added)(const IDevice *dev);
    void (*device_removed)(const IDevice *dev);
    struct IHotSwapListener *next;
} IHotSwapListener;

#ifdef __cplusplus
}
#endif

#endif // PHILLOS_IHOTSWAPLISTENER_H

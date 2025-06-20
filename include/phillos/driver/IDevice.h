#ifndef PHILLOS_IDEVICE_H
#define PHILLOS_IDEVICE_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct IDevice {
    uint8_t bus;
    uint8_t slot;
    uint8_t func;
    uint16_t vendor_id;
    uint16_t device_id;
    uint8_t class_code;
    uint8_t subclass;
} IDevice;

#ifdef __cplusplus
}
#endif

#endif // PHILLOS_IDEVICE_H

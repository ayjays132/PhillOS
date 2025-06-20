#ifndef PHILLOS_DRIVER_H
#define PHILLOS_DRIVER_H

typedef struct driver {
    int (*probe)(void);  // return 1 if device is present
    void (*init)(void);  // initialize the device
    struct driver *next;
} driver_t;

void driver_register(driver_t *drv);
void driver_init_all(void);

#endif // PHILLOS_DRIVER_H

#include "driver.h"

static driver_t *driver_list = NULL;

void driver_register(driver_t *drv)
{
    if (!drv)
        return;
    drv->next = driver_list;
    driver_list = drv;
}

void driver_init_all(void)
{
    for (driver_t *d = driver_list; d; d = d->next) {
        if (!d->probe || d->probe()) {
            if (d->init)
                d->init();
        }
    }
}

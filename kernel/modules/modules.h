#ifndef PHILLOS_MODULES_H
#define PHILLOS_MODULES_H

#include "../elf.h"
#include "../../drivers/driver_manager.h"

typedef struct module {
    struct module *next;
    char path[64];
    void *file_data;
    uint32_t file_size;
    elf_image_t image;
    driver_t *driver;
} module_t;

module_t *module_load(const char *path);
void module_unload(module_t *mod);
module_t *module_find_by_driver(driver_t *drv);

#endif // PHILLOS_MODULES_H

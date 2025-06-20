#include "modules.h"
#include "../fs/fat32.h"
#include "../memory/heap.h"
#include "../debug.h"
#include <string.h>

static module_t *module_list = NULL;

module_t *module_load(const char *path)
{
    if (!path)
        return NULL;
    uint32_t size = 0;
    void *data = fat32_load_file(path, &size);
    if (!data) {
        debug_puts("module_load: failed ");
        debug_puts(path);
        debug_putc('\n');
        return NULL;
    }

    elf_image_t img;
    if (elf_load_image(data, size, &img)) {
        debug_puts("module_load: bad ELF ");
        debug_puts(path);
        debug_putc('\n');
        kfree(data);
        return NULL;
    }

    driver_t *drv = (driver_t *)elf_lookup_symbol(&img, "driver_entry");
    if (!drv) {
        debug_puts("module_load: no driver_entry in ");
        debug_puts(path);
        debug_putc('\n');
        kfree(img.base);
        kfree(data);
        return NULL;
    }

    module_t *mod = kmalloc(sizeof(module_t));
    if (!mod) {
        kfree(img.base);
        kfree(data);
        return NULL;
    }
    memset(mod, 0, sizeof(module_t));
    strncpy(mod->path, path, sizeof(mod->path)-1);
    mod->file_data = data;
    mod->file_size = size;
    mod->image = img;
    mod->driver = drv;

    mod->next = module_list;
    module_list = mod;

    driver_manager_register(drv);
    return mod;
}

static void remove_from_list(module_t *mod)
{
    module_t **p = &module_list;
    while (*p) {
        if (*p == mod) {
            *p = mod->next;
            return;
        }
        p = &(*p)->next;
    }
}

void module_unload(module_t *mod)
{
    if (!mod)
        return;
    driver_manager_unregister(mod->driver);
    remove_from_list(mod);
    kfree(mod->image.base);
    kfree(mod->file_data);
    kfree(mod);
}

module_t *module_find_by_driver(driver_t *drv)
{
    for (module_t *m = module_list; m; m = m->next) {
        if (m->driver == drv)
            return m;
    }
    return NULL;
}

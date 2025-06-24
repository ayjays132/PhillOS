#include "display.h"
#include "init.h"
#include "fs/fat32.h"
#include "memory/heap.h"
#include "debug.h"
#include <stdint.h>

void display_reload_cfg(void)
{
    uint32_t size = 0;
    char *data = fat32_load_file("/EFI/PHILLOS/display.cfg", &size);
    if (!data) {
        debug_puts("display_reload_cfg: display.cfg missing\n");
        return;
    }

    uint32_t w = 0, h = 0, r = 0;
    size_t i = 0;
    int valid = 0;

    while (i < size && data[i] >= '0' && data[i] <= '9') {
        w = w * 10 + (data[i] - '0');
        i++;
    }
    if (i < size && data[i] == 'x') {
        i++;
        while (i < size && data[i] >= '0' && data[i] <= '9') {
            h = h * 10 + (data[i] - '0');
            i++;
        }
        if (h > 0)
            valid = 1;
    }
    if (valid && i < size && data[i] == '@') {
        i++;
        while (i < size && data[i] >= '0' && data[i] <= '9') {
            r = r * 10 + (data[i] - '0');
            i++;
        }
    }

    if (!valid) {
        debug_puts("display_reload_cfg: malformed config\n");
        kfree(data);
        return;
    }

    boot_info_t *info = boot_info_get();
    if (info) {
        info->display_width = w;
        info->display_height = h;
        info->display_refresh = r;
    }

    debug_puts("display mode ");
    debug_puthex(w);
    debug_putc('x');
    debug_puthex(h);
    if (r) {
        debug_putc('@');
        debug_puthex(r);
    }
    debug_putc('\n');

    kfree(data);
}

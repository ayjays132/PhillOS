#include "cursor.h"
#include "fs/fat32.h"
#include "memory/heap.h"
#include "debug.h"
#include <string.h>

static int g_cursor_dark = 1;

void cursor_init(int boot_dark)
{
    g_cursor_dark = boot_dark ? 1 : 0;
}

int cursor_is_dark(void)
{
    return g_cursor_dark;
}

void cursor_reload_cfg(void)
{
    uint32_t size = 0;
    char *data = fat32_load_file("/EFI/PHILLOS/cursor.cfg", &size);
    if (!data) {
        debug_puts("cursor_reload_cfg: cursor.cfg missing\n");
        return;
    }
    int dark = g_cursor_dark;
    int valid = 0;
    if (size > 0) {
        if (data[0] == '0') {
            dark = 0;
            valid = 1;
        } else if (data[0] == '1') {
            dark = 1;
            valid = 1;
        } else if (size >= 4 &&
                   (data[0]=='d'||data[0]=='D') &&
                   (data[1]=='a'||data[1]=='A') &&
                   (data[2]=='r'||data[2]=='R') &&
                   (data[3]=='k'||data[3]=='K')) {
            dark = 1;
            valid = 1;
        } else if (size >= 5 &&
                   (data[0]=='l'||data[0]=='L') &&
                   (data[1]=='i'||data[1]=='I') &&
                   (data[2]=='g'||data[2]=='G') &&
                   (data[3]=='h'||data[3]=='H') &&
                   (data[4]=='t'||data[4]=='T')) {
            dark = 0;
            valid = 1;
        }
    }
    if (!valid)
        debug_puts("cursor_reload_cfg: malformed config\n");
    kfree(data);
    g_cursor_dark = dark;
    debug_puts("cursor ");
    if (g_cursor_dark)
        debug_puts("DARK\n");
    else
        debug_puts("LIGHT\n");
}

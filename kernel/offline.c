#include "offline.h"
#include "boot_info.h"
#include "fs/fat32.h"
#include "memory/heap.h"
#include "debug.h"
#include <string.h>

static int g_offline = 0;

void offline_init(boot_info_t *info)
{
    if (info)
        g_offline = info->offline ? 1 : 0;
    else
        g_offline = 0;
}

int offline_is_enabled(void)
{
    return g_offline;
}

void offline_set(int enabled)
{
    g_offline = enabled ? 1 : 0;
}

void offline_reload_cfg(void)
{
    uint32_t size = 0;
    char *data = fat32_load_file("/EFI/PHILLOS/offline.cfg", &size);
    if (!data) {
        debug_puts("offline_reload_cfg: offline.cfg missing\n");
        return;
    }
    int enable = 0;
    int valid = 0;
    if (size > 0) {
        if (data[0] == '1') {
            enable = 1;
            valid = 1;
        } else if (size >= 2 &&
                   (data[0]=='o' || data[0]=='O') &&
                   (data[1]=='n' || data[1]=='N')) {
            enable = 1;
            valid = 1;
        } else if (size >= 3 &&
                   (data[0]=='y' || data[0]=='Y') &&
                   (data[1]=='e' || data[1]=='E') &&
                   (data[2]=='s' || data[2]=='S')) {
            enable = 1;
            valid = 1;
        } else if (size >= 4 &&
                   (data[0]=='t' || data[0]=='T') &&
                   (data[1]=='r' || data[1]=='R') &&
                   (data[2]=='u' || data[2]=='U') &&
                   (data[3]=='e' || data[3]=='E')) {
            enable = 1;
            valid = 1;
        }
    }
    if (!valid)
        debug_puts("offline_reload_cfg: malformed config\n");
    kfree(data);
    g_offline = enable;
    debug_puts("offline mode ");
    if (g_offline)
        debug_puts("ENABLED\n");
    else
        debug_puts("DISABLED\n");
}

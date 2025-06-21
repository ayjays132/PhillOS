#include "offline.h"
#include "boot_info.h"

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

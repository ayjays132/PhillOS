#include "bluetooth.h"
#include "../../kernel/debug.h"
#include <stdlib.h>
#include <stdio.h>

void init_bluetooth(void)
{
    debug_puts("Initializing Bluetooth stack\n");
    system("hciconfig hci0 up >/dev/null 2>&1");
}

int bluetooth_start_pairing(const char *name)
{
    if (name && *name) {
        char cmd[256];
        snprintf(cmd, sizeof(cmd), "bluetoothctl system-alias %s", name);
        system(cmd);
    }
    int ret = 0;
    ret |= system("bluetoothctl pairable on");
    ret |= system("bluetoothctl discoverable on");
    ret |= system("bluetoothctl agent NoInputNoOutput");
    ret |= system("bluetoothctl default-agent");
    return ret;
}

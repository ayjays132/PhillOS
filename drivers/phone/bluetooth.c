#include "bluetooth.h"
#include "../../kernel/debug.h"

void init_bluetooth(void)
{
    debug_puts("Initializing Bluetooth stack\n");
    // TODO: initialize controller and enable radio
}

int bluetooth_start_pairing(const char *name)
{
    (void)name;
    debug_puts("bluetooth_start_pairing stub\n");
    return -1;
}

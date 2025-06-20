#include "bluetooth.h"
#include "../../kernel/debug.h"
#include <stdlib.h>
#include <stdio.h>
#include <errno.h>
#include <unistd.h>
#include <sys/ioctl.h>
#include <bluetooth/bluetooth.h>
#include <bluetooth/hci.h>
#include <bluetooth/hci_lib.h>

static int bt_up = 0;

void init_bluetooth(void)
{
    debug_puts("Initializing Bluetooth stack\n");
    int dev_id = hci_get_route(NULL);
    if (dev_id < 0) {
        debug_puts("No Bluetooth adapter\n");
        return;
    }
    int sock = hci_open_dev(dev_id);
    if (sock < 0) {
        perror("hci_open_dev");
        return;
    }
    if (ioctl(sock, HCIDEVUP, dev_id) < 0 && errno != EALREADY) {
        perror("HCIDEVUP");
    } else {
        bt_up = 1;
    }
    close(sock);
}

int bluetooth_is_up(void)
{
    return bt_up;
}

int bluetooth_start_pairing(const char *name)
{
    if (!bt_up)
        return -1;

    int dev_id = hci_get_route(NULL);
    int sock = hci_open_dev(dev_id);
    if (sock < 0)
        return -1;

    if (name && *name) {
        hci_write_local_name(sock, name, 1000);
    }

    uint8_t mode = 1;
    hci_write_simple_pairing_mode(sock, mode, 1000);
    uint8_t scan = 3; // inquiry + page scan
    hci_write_scan_enable(sock, scan, 1000);
    close(sock);
    return 0;
}

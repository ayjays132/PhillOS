#include "sim.h"
#include "../../kernel/debug.h"
#include <stdio.h>
#include <string.h>
#include <unistd.h>

static int modem_present = 0;

static const char *iccid_paths[] = {
    "/sys/class/mmc_host/mmc0/mmc0:0001/iccid",
    "/sys/class/net/wwan0/address",
    "/etc/iccid",
    NULL
};

void init_sim(void)
{
    debug_puts("Initializing SIM interface\n");
    if (access("/dev/ttyUSB0", F_OK) == 0 || access("/dev/wwan0", F_OK) == 0) {
        modem_present = 1;
        debug_puts("Modem detected\n");
    } else {
        debug_puts("No modem detected\n");
    }
}

int sim_read_iccid(char *buf, int len)
{
    if (!modem_present || !buf || len <= 0)
        return -1;

    for (const char **p = iccid_paths; *p; ++p) {
        FILE *f = fopen(*p, "r");
        if (!f)
            continue;
        if (fgets(buf, len, f)) {
            buf[strcspn(buf, "\n")] = '\0';
            fclose(f);
            return 0;
        }
        fclose(f);
    }
    debug_puts("ICCID read failed\n");
    return -1;
}

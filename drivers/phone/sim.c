#include "sim.h"
#include "../../kernel/debug.h"

void init_sim(void)
{
    debug_puts("Initializing SIM interface\n");
    // TODO: detect and initialize modem hardware
}

int sim_read_iccid(char *buf, int len)
{
    (void)buf;
    (void)len;
    debug_puts("sim_read_iccid stub\n");
    return -1;
}

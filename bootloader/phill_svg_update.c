#include "phill_svg_update.h"
#include <string.h>

phill_boot_metrics_t g_phill_boot_metrics;

static void read_pcr_digest(char *out)
{
    /* Placeholder - real implementation would query TPM */
    strcpy(out, "");
}

static int read_cpu_temp(void)
{
    /* Placeholder for sensor read */
    return 0;
}

static int read_fan_rpm(void)
{
    /* Placeholder for fan sensor */
    return 0;
}

void phill_svg_update(void)
{
    read_pcr_digest(g_phill_boot_metrics.pcr_digest);
    g_phill_boot_metrics.cpu_temp = read_cpu_temp();
    g_phill_boot_metrics.fan_rpm = read_fan_rpm();
}

#ifndef PHILL_SVG_UPDATE_H
#define PHILL_SVG_UPDATE_H

#include <stdint.h>

typedef struct {
    char pcr_digest[64];
    int cpu_temp;
    int fan_rpm;
} phill_boot_metrics_t;

extern phill_boot_metrics_t g_phill_boot_metrics;

void phill_svg_update(void);

#endif /* PHILL_SVG_UPDATE_H */

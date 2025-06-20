#include "anomaly.h"
#include "../driver_manager.h"
#include "../../kernel/debug.h"

static int g_score = 0;

// Placeholder for eBPF attachment logic
static void attach_ebpf_probes(void)
{
    // In a real system this would load and attach BPF programs
    debug_puts("[anomaly] attaching eBPF probes\n");
}

void anomaly_init(void)
{
    attach_ebpf_probes();
    g_score = 0;
}

int anomaly_update_score(void)
{
    // Normally this would collect metrics from eBPF maps
    g_score = (g_score + 7) % 100;
    return g_score;
}

int anomaly_get_score(void)
{
    return g_score;
}


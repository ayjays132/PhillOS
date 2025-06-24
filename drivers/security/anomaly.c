#include "anomaly.h"
#include "../driver_manager.h"
#include "../../kernel/debug.h"
#include "syscall_detector.h"
#include <bpf/libbpf.h>
#include <bpf/bpf.h>
#include <stdint.h>

static int g_score = 0;
static struct bpf_object *bpf_obj;
static struct bpf_link *link_enter;
static struct bpf_link *link_exit;
static int metrics_fd = -1;
static int have_bpf = 0;

static void attach_ebpf_probes(void)
{
    bpf_obj = bpf_object__open_file("/lib/phillos/anomaly.bpf.o", NULL);
    if (!bpf_obj) {
        debug_puts("[anomaly] failed to open BPF object\n");
        return;
    }
    if (bpf_object__load(bpf_obj)) {
        debug_puts("[anomaly] failed to load BPF object\n");
        bpf_object__close(bpf_obj);
        bpf_obj = NULL;
        return;
    }

    struct bpf_program *prog;

    prog = bpf_object__find_program_by_name(bpf_obj, "trace_enter");
    if (prog)
        link_enter = bpf_program__attach_tracepoint(prog, "syscalls", "sys_enter");

    prog = bpf_object__find_program_by_name(bpf_obj, "trace_exit");
    if (prog)
        link_exit = bpf_program__attach_tracepoint(prog, "syscalls", "sys_exit");

    metrics_fd = bpf_object__find_map_fd_by_name(bpf_obj, "anomaly_metrics");
    if (metrics_fd >= 0 && link_enter && link_exit) {
        have_bpf = 1;
        debug_puts("[anomaly] eBPF probes attached\n");
    } else {
        debug_puts("[anomaly] failed to attach eBPF probes\n");
    }
}

void anomaly_init(void)
{
    attach_ebpf_probes();
    g_score = 0;
}

int anomaly_update_score(void)
{
    if (have_bpf && metrics_fd >= 0) {
        __u32 key = 0;
        __u64 val = 0;
        if (bpf_map_lookup_elem(metrics_fd, &key, &val) == 0)
            g_score = (int)val;
    } else {
        g_score = syscall_predict_threat();
    }
    if (g_score > 100) g_score = 100;
    return g_score;
}

int anomaly_get_score(void)
{
    return g_score;
}


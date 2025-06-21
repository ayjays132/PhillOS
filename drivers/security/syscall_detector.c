#include "syscall_detector.h"
#include "../../kernel/debug.h"
#include <string.h>

#define MAX_SYSCALLS 256
static unsigned int counts[MAX_SYSCALLS];
static const int suspicious[] = {11, 59}; // execve variants

void syscall_detector_init(void)
{
    memset(counts, 0, sizeof(counts));
}

void syscall_record(int nr)
{
    if (nr >= 0 && nr < MAX_SYSCALLS)
        counts[nr]++;
}

static int total_calls(void)
{
    unsigned int sum = 0;
    for (int i = 0; i < MAX_SYSCALLS; i++)
        sum += counts[i];
    return sum;
}

int syscall_predict_threat(void)
{
    unsigned int sus = 0;
    for (unsigned int i = 0; i < sizeof(suspicious)/sizeof(suspicious[0]); i++)
        sus += counts[suspicious[i]];
    unsigned int total = total_calls();
    if (!total)
        return 0;
    int score = (int)((sus * 100) / total);
    if (score > 100) score = 100;
    debug_puts("[syscall_detector] predicted threat score:\n");
    return score;
}

#include "../../kernel/scheduler/chaos_sched.h"
#include <stdio.h>

int main(void) {
    chaos_sched_t sched;
    chaos_sched_init(&sched, 0.01f, 0.005f, 0.1f, 0.1f);

    for (int i = 0; i < 4; i++)
        if (chaos_sched_add(&sched, i) != 0)
            return 1;

    chaos_sched_step(&sched);

    float slices[CHAOS_MAX_TASKS] = {0};
    chaos_sched_slices(&sched, slices, sched.count);

    float sum = 0.0f;
    for (size_t i = 0; i < sched.count; i++)
        sum += slices[i];

    if (sum < 0.99f || sum > 1.01f) {
        fprintf(stderr, "invalid slice sum: %f\n", sum);
        return 1;
    }

    printf("chaos scheduler tests passed\n");
    return 0;
}

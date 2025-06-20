#ifndef PHILLOS_CHAOS_SCHED_H
#define PHILLOS_CHAOS_SCHED_H

#include <stddef.h>

#define CHAOS_MAX_TASKS 64

typedef struct {
    int id;
    float real;
    float imag;
} chaos_task_t;

typedef struct {
    chaos_task_t tasks[CHAOS_MAX_TASKS];
    size_t count;
    float gamma;
    float alpha;
    float epsilon;
    float dt;
} chaos_sched_t;

void chaos_sched_init(chaos_sched_t *sched, float gamma, float alpha,
                      float epsilon, float dt);
int chaos_sched_add(chaos_sched_t *sched, int id);
void chaos_sched_step(chaos_sched_t *sched);
void chaos_sched_slices(const chaos_sched_t *sched, float *out_slices,
                        size_t slice_count);

#endif // PHILLOS_CHAOS_SCHED_H

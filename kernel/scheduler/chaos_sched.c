#include "chaos_sched.h"

static unsigned int rng_state = 1;

static float frand(void) {
    rng_state = rng_state * 1103515245 + 12345;
    return (rng_state & 0x7fffffff) / 2147483648.0f;
}

void chaos_sched_init(chaos_sched_t *sched, float gamma, float alpha,
                      float epsilon, float dt)
{
    if (!sched)
        return;
    sched->count = 0;
    sched->gamma = gamma;
    sched->alpha = alpha;
    sched->epsilon = epsilon;
    sched->dt = dt;
}

int chaos_sched_add(chaos_sched_t *sched, int id)
{
    if (!sched || sched->count >= CHAOS_MAX_TASKS)
        return -1;
    chaos_task_t *t = &sched->tasks[sched->count++];
    t->id = id;
    t->real = frand();
    t->imag = frand();
    return 0;
}

void chaos_sched_step(chaos_sched_t *sched)
{
    if (!sched || sched->count == 0)
        return;
    float avg_r = 0.0f;
    float avg_i = 0.0f;
    for (size_t i = 0; i < sched->count; i++) {
        avg_r += sched->tasks[i].real;
        avg_i += sched->tasks[i].imag;
    }
    avg_r /= (float)sched->count;
    avg_i /= (float)sched->count;

    for (size_t i = 0; i < sched->count; i++) {
        chaos_task_t *t = &sched->tasks[i];
        float dr = t->real - avg_r;
        float di = t->imag - avg_i;
        float mag2 = t->real * t->real + t->imag * t->imag;
        float f = sched->gamma * mag2 + sched->alpha * (dr * dr + di * di) * sched->epsilon;
        float new_r = t->real - f * t->imag * sched->dt;
        float new_i = t->imag + f * t->real * sched->dt;
        t->real = new_r;
        t->imag = new_i;
    }
}

void chaos_sched_slices(const chaos_sched_t *sched, float *out_slices,
                        size_t slice_count)
{
    if (!sched || !out_slices || slice_count < sched->count)
        return;
    float total = 0.0f;
    for (size_t i = 0; i < sched->count; i++) {
        float mag = sched->tasks[i].real * sched->tasks[i].real +
                    sched->tasks[i].imag * sched->tasks[i].imag;
        out_slices[i] = mag;
        total += mag;
    }
    if (total == 0.0f) {
        float val = 1.0f / (float)sched->count;
        for (size_t i = 0; i < sched->count; i++)
            out_slices[i] = val;
    } else {
        for (size_t i = 0; i < sched->count; i++)
            out_slices[i] /= total;
    }
}

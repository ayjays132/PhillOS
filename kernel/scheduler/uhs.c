#include "uhs.h"
#include "../memory/heap.h"

int uhs_compute(const float *A, const float *B,
                const float *R_tot, size_t N, size_t M, size_t R,
                float *out_x)
{
    if (!A || !B || !R_tot || !out_x || N == 0 || M == 0 || R == 0)
        return -1;

    size_t demand_sz = N * R * sizeof(float);
    float *demand = (float *)agent_alloc(demand_sz);
    if (!demand)
        return -1;
    size_t total_sz = R * sizeof(float);
    float *total = (float *)agent_alloc(total_sz);
    if (!total) {
        agent_free(demand);
        return -1;
    }

    for (size_t i = 0; i < N; i++) {
        for (size_t r = 0; r < R; r++) {
            float sum = 0.0f;
            for (size_t j = 0; j < M; j++)
                sum += A[i * M + j] * B[j * R + r];
            demand[i * R + r] = sum;
        }
    }

    for (size_t r = 0; r < R; r++) {
        float t = 0.0f;
        for (size_t i = 0; i < N; i++)
            t += demand[i * R + r];
        total[r] = t;
    }

    for (size_t i = 0; i < N; i++) {
        for (size_t r = 0; r < R; r++) {
            if (total[r] > 0.0f)
                out_x[i * R + r] = demand[i * R + r] / total[r] * R_tot[r];
            else
                out_x[i * R + r] = R_tot[r] / (float)N;
        }
    }

    agent_free(demand);
    agent_free(total);
    return 0;
}

#ifndef PHILLOS_UHS_H
#define PHILLOS_UHS_H

#include <stddef.h>

int uhs_compute(const float *A, const float *B,
                const float *R_tot, size_t N, size_t M, size_t R,
                float *out_x);

float uhs_last_residual(void);

#endif // PHILLOS_UHS_H

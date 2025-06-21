#include "uhs.h"
#include "../memory/heap.h"
#include <math.h>

static float g_last_residual = 0.0f;

static int solve_linear(float *A, float *b, float *x, size_t n)
{
    /* Gaussian elimination with partial pivoting */
    for (size_t i = 0; i < n; i++) {
        size_t pivot = i;
        float max = fabsf(A[i * n + i]);
        for (size_t r = i + 1; r < n; r++) {
            float val = fabsf(A[r * n + i]);
            if (val > max) {
                max = val;
                pivot = r;
            }
        }
        if (max == 0.0f)
            return -1;
        if (pivot != i) {
            for (size_t c = i; c < n; c++) {
                float tmp = A[i * n + c];
                A[i * n + c] = A[pivot * n + c];
                A[pivot * n + c] = tmp;
            }
            float tb = b[i];
            b[i] = b[pivot];
            b[pivot] = tb;
        }
        float piv = A[i * n + i];
        for (size_t r = i + 1; r < n; r++) {
            float f = A[r * n + i] / piv;
            A[r * n + i] = 0.0f;
            for (size_t c = i + 1; c < n; c++)
                A[r * n + c] -= f * A[i * n + c];
            b[r] -= f * b[i];
        }
    }
    for (size_t idx = n; idx-- > 0; ) {
        size_t i = idx;
        float sum = b[i];
        for (size_t c = i + 1; c < n; c++)
            sum -= A[i * n + c] * x[c];
        x[i] = sum / A[i * n + i];
    }
    return 0;
}

int uhs_compute(const float *A, const float *B,
                const float *R_tot, size_t N, size_t M, size_t R,
                float *out_x)
{
    if (!A || !B || !R_tot || !out_x || N == 0 || M == 0 || R == 0)
        return -1;

    size_t nm = N * M;
    size_t rsz = R;
    float *U = (float *)agent_alloc(nm * sizeof(float));
    float *price = (float *)agent_alloc(nm * sizeof(float));
    float *xcand = (float *)agent_alloc(nm * sizeof(float));
    float *sigma = (float *)agent_alloc(rsz * sizeof(float));
    float *S_mode = (float *)agent_alloc(rsz * sizeof(float));
    float *p = (float *)agent_alloc(rsz * sizeof(float));
    float *p_eps = (float *)agent_alloc(rsz * sizeof(float));
    float *sigma_eps = (float *)agent_alloc(rsz * sizeof(float));
    float *J = (float *)agent_alloc(rsz * rsz * sizeof(float));
    float *dp = (float *)agent_alloc(rsz * sizeof(float));
    float *residual = (float *)agent_alloc(rsz * sizeof(float));
    float *x_eps = (float *)agent_alloc(nm * sizeof(float));
    float *price_eps = (float *)agent_alloc(nm * sizeof(float));

    if (!U || !price || !xcand || !sigma || !S_mode || !p || !p_eps ||
        !sigma_eps || !J || !dp || !residual || !x_eps || !price_eps) {
        agent_free(U); agent_free(price); agent_free(xcand); agent_free(sigma);
        agent_free(S_mode); agent_free(p); agent_free(p_eps); agent_free(sigma_eps);
        agent_free(J); agent_free(dp); agent_free(residual); agent_free(x_eps); agent_free(price_eps);
        return -1;
    }

    for (size_t i = 0; i < nm; i++)
        U[i] = 0.0f;
    for (size_t i = 0; i < N; i++) {
        for (size_t j = 0; j < M; j++) {
            float sum = 0.0f;
            for (size_t r = 0; r < R; r++)
                sum += A[i * R + r] * B[r * M + j];
            U[i * M + j] = sum;
        }
    }
    for (size_t r = 0; r < R; r++) {
        float sum = 0.0f;
        for (size_t j = 0; j < M; j++)
            sum += B[r * M + j] * R_tot[j];
        S_mode[r] = sum;
        p[r] = 0.0f;
    }

    const float tol = 1e-8f;
    const float eps = 1e-5f;
    const size_t max_iter = 10;

    for (size_t it = 0; it < max_iter; it++) {
        /* price component */
        for (size_t i = 0; i < N; i++) {
            for (size_t j = 0; j < M; j++) {
                float sum = 0.0f;
                for (size_t r = 0; r < R; r++)
                    sum += A[i * R + r] * p[r] * B[r * M + j];
                price[i * M + j] = sum;
            }
        }
        /* softmax allocation */
        for (size_t j = 0; j < M; j++) {
            float denom = 0.0f;
            for (size_t i = 0; i < N; i++) {
                float val = expf(U[i * M + j] - price[i * M + j]);
                xcand[i * M + j] = val;
                denom += val;
            }
            if (denom == 0.0f)
                denom = 1.0f;
            for (size_t i = 0; i < N; i++)
                xcand[i * M + j] = (xcand[i * M + j] / denom) * R_tot[j];
        }
        /* sigma */
        for (size_t r = 0; r < R; r++) {
            float sum = 0.0f;
            for (size_t i = 0; i < N; i++) {
                for (size_t j = 0; j < M; j++) {
                    sum += A[i * R + r] * B[r * M + j] * xcand[i * M + j];
                }
            }
            sigma[r] = sum;
        }
        float norm_sq = 0.0f;
        for (size_t r = 0; r < R; r++) {
            residual[r] = sigma[r] - S_mode[r];
            norm_sq += residual[r] * residual[r];
        }
        g_last_residual = sqrtf(norm_sq);
        if (g_last_residual < tol)
            break;
        /* Jacobian */
        for (size_t r2 = 0; r2 < R; r2++) {
            for (size_t r = 0; r < R; r++)
                p_eps[r] = p[r];
            p_eps[r2] += eps;
            /* price comp with perturbed p */
            for (size_t i = 0; i < N; i++) {
                for (size_t j = 0; j < M; j++) {
                    float sum = 0.0f;
                    for (size_t r = 0; r < R; r++)
                        sum += A[i * R + r] * p_eps[r] * B[r * M + j];
                    price_eps[i * M + j] = sum;
                }
            }
            /* softmax allocation for perturbed p */
            for (size_t j = 0; j < M; j++) {
                float denom = 0.0f;
                for (size_t i = 0; i < N; i++) {
                    float val = expf(U[i * M + j] - price_eps[i * M + j]);
                    x_eps[i * M + j] = val;
                    denom += val;
                }
                if (denom == 0.0f)
                    denom = 1.0f;
                for (size_t i = 0; i < N; i++)
                    x_eps[i * M + j] = (x_eps[i * M + j] / denom) * R_tot[j];
            }
            for (size_t r = 0; r < R; r++) {
                float sum = 0.0f;
                for (size_t i = 0; i < N; i++)
                    for (size_t j = 0; j < M; j++)
                        sum += A[i * R + r] * B[r * M + j] * x_eps[i * M + j];
                sigma_eps[r] = sum;
            }
            for (size_t r = 0; r < R; r++)
                J[r * R + r2] = (sigma_eps[r] - sigma[r]) / eps;
        }
        for (size_t i = 0; i < R; i++)
            dp[i] = residual[i];
        if (solve_linear(J, dp, dp, R) != 0)
            break;
        for (size_t r = 0; r < R; r++)
            p[r] -= dp[r];
    }

    /* final allocation using last computed xcand */
    for (size_t i = 0; i < nm; i++)
        out_x[i] = xcand[i];

    agent_free(U); agent_free(price); agent_free(xcand); agent_free(sigma);
    agent_free(S_mode); agent_free(p); agent_free(p_eps); agent_free(sigma_eps);
    agent_free(J); agent_free(dp); agent_free(residual); agent_free(x_eps); agent_free(price_eps);

    return 0;
}

float uhs_last_residual(void)
{
    return g_last_residual;
}

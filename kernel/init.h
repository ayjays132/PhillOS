#ifndef PHILLOS_INIT_H
#define PHILLOS_INIT_H

#include "boot_info.h"

void kernel_main(boot_info_t *boot_info);
boot_info_t *boot_info_get(void);

int schedule_resources(const float *A, const float *B,
                       const float *R_tot, size_t N, size_t M, size_t R,
                       float *out_x);

#endif // PHILLOS_INIT_H

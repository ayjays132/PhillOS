#ifndef PHILLOS_SIGNATURE_H
#define PHILLOS_SIGNATURE_H

#include <stdint.h>
#include <stddef.h>

#define MODULE_SIG_LEN 256

int verify_module_signature(const void *data, size_t size, const uint8_t *sig);

#endif // PHILLOS_SIGNATURE_H

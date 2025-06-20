#include "signature.h"

// Simple FNV-1a 64-bit hash used as digest
static uint64_t fnv1a64(const void *data, size_t len)
{
    const uint8_t *p = (const uint8_t *)data;
    uint64_t hash = 0xcbf29ce484222325ULL;
    for (size_t i = 0; i < len; i++) {
        hash ^= p[i];
        hash *= 0x100000001b3ULL;
    }
    return hash;
}

// RSA public key (128-bit modulus) and exponent 65537
static const __uint128_t RSA_N =
    (((__uint128_t)0xc1969b73a8da6651ULL << 64) | 0xb25e423b1c6d979bULL);
static const uint32_t RSA_E = 65537;

// modular exponentiation for 128-bit numbers
static __uint128_t mod_pow(__uint128_t base, uint32_t exp, __uint128_t mod)
{
    __uint128_t result = 1;
    while (exp) {
        if (exp & 1)
            result = (result * base) % mod;
        base = (base * base) % mod;
        exp >>= 1;
    }
    return result;
}

int verify_module_signature(const void *data, size_t size, const uint8_t *sig)
{
    if (!data || !sig || size == 0)
        return 0;

    // parse big-endian 128-bit signature
    __uint128_t s = 0;
    for (int i = 0; i < MODULE_SIG_LEN; i++) {
        s = (s << 8) | sig[i];
    }

    __uint128_t v = mod_pow(s, RSA_E, RSA_N);
    uint64_t hash = fnv1a64(data, size);
    return (uint64_t)v == hash;
}

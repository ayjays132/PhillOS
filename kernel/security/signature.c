#include "signature.h"
#include "bn.h"

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

// RSA-2048 public key modulus and exponent 65537
static const struct bn RSA_N = {
    .array = {
        0x4178ece3, 0x8d02b096, 0xba683217, 0x6bf392b7,
        0x25aaa04e, 0x9ba73792, 0xc92eacce, 0xd917e3e8,
        0x55ffa2e8, 0x04e6c468, 0xb5b74700, 0x772fdf34,
        0xa27e74fb, 0xdac9506e, 0xabb141d2, 0xbb34e87f,
        0x1ff4b773, 0xdfac1864, 0x30731396, 0x0ac0fa7e,
        0xf83166f0, 0xc41cc09c, 0x6175909f, 0xb36dfe02,
        0x0b4b1c8c, 0xb21d435b, 0x4d414562, 0x51da837e,
        0x0797969d, 0xe956d1d3, 0x0c69be8e, 0x04e00dce,
        0x511e7748, 0xcf4fbe6b, 0xd6c9c767, 0xc4794e0b,
        0x64259c91, 0x34bb200f, 0x58513ccc, 0xb2a3c64f,
        0x64cff576, 0xef6a5ae4, 0x74eebcc1, 0x57f15a1d,
        0xaf57476c, 0x61228dae, 0x3bf5df7e, 0x538aee30,
        0x43b23f1b, 0x7a6b80dc, 0x4474fc40, 0x6b0b7b34,
        0xba871452, 0x23852e1d, 0x30965608, 0x36d6b48d,
        0xfec57c1e, 0xd6fbffe5, 0x2fcf45c4, 0x6b523f42,
        0xfd0336a1, 0x65c187da, 0x65db952b, 0xb86cdd55
    }
};
static const uint32_t RSA_E = 65537;

// modular exponentiation using bignum library
static void mod_pow(struct bn* base, uint32_t exp, const struct bn* mod, struct bn* out)
{
    struct bn btmp;
    bignum_assign(&btmp, base);
    bignum_powmod(&btmp, exp, (struct bn*)mod, out);
}

static int bn_is_zero_range(const struct bn *n, int start)
{
    for (int i = start; i < BN_ARRAY_SIZE; i++)
        if (n->array[i])
            return 0;
    return 1;
}

static uint64_t bn_to_u64(const struct bn *n)
{
    return ((uint64_t)n->array[1] << 32) | n->array[0];
}

int verify_module_signature(const void *data, size_t size, const uint8_t *sig)
{
    if (!data || !sig || size == 0)
        return 0;

    // parse big-endian 2048-bit signature into bignum
    struct bn s, v;
    bignum_init(&s);
    for (int i = 0; i < MODULE_SIG_LEN; i++) {
        bignum_lshift(&s, &s, 8);
        struct bn tmp;
        bignum_from_int(&tmp, sig[i]);
        bignum_or(&s, &tmp, &s);
    }

    mod_pow(&s, RSA_E, &RSA_N, &v);
    uint64_t hash = fnv1a64(data, size);

    if (!bn_is_zero_range(&v, 2))
        return 0;

    return bn_to_u64(&v) == hash;
}

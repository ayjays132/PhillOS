#include "signature.h"
#include "bn.h"
#include <string.h>

// Minimal SHA-256 implementation for signature verification
typedef struct {
    uint32_t state[8];
    uint64_t bitlen;
    uint8_t data[64];
    size_t datalen;
} sha256_ctx;

static const uint32_t K[64] = {
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
};

#define ROTRIGHT(a,b) (((a) >> (b)) | ((a) << (32-(b))))
#define CH(x,y,z) (((x) & (y)) ^ (~(x) & (z)))
#define MAJ(x,y,z) (((x) & (y)) ^ ((x) & (z)) ^ ((y) & (z)))
#define EP0(x) (ROTRIGHT(x,2) ^ ROTRIGHT(x,13) ^ ROTRIGHT(x,22))
#define EP1(x) (ROTRIGHT(x,6) ^ ROTRIGHT(x,11) ^ ROTRIGHT(x,25))
#define SIG0(x) (ROTRIGHT(x,7) ^ ROTRIGHT(x,18) ^ ((x) >> 3))
#define SIG1(x) (ROTRIGHT(x,17) ^ ROTRIGHT(x,19) ^ ((x) >> 10))

static void sha256_transform(sha256_ctx *ctx, const uint8_t data[64])
{
    uint32_t m[64];
    for (int i = 0; i < 16; i++) {
        m[i] = (uint32_t)data[i*4] << 24 | (uint32_t)data[i*4+1] << 16 |
               (uint32_t)data[i*4+2] << 8 | (uint32_t)data[i*4+3];
    }
    for (int i = 16; i < 64; i++)
        m[i] = SIG1(m[i-2]) + m[i-7] + SIG0(m[i-15]) + m[i-16];

    uint32_t a = ctx->state[0];
    uint32_t b = ctx->state[1];
    uint32_t c = ctx->state[2];
    uint32_t d = ctx->state[3];
    uint32_t e = ctx->state[4];
    uint32_t f = ctx->state[5];
    uint32_t g = ctx->state[6];
    uint32_t h = ctx->state[7];

    for (int i = 0; i < 64; i++) {
        uint32_t t1 = h + EP1(e) + CH(e,f,g) + K[i] + m[i];
        uint32_t t2 = EP0(a) + MAJ(a,b,c);
        h = g;
        g = f;
        f = e;
        e = d + t1;
        d = c;
        c = b;
        b = a;
        a = t1 + t2;
    }

    ctx->state[0] += a;
    ctx->state[1] += b;
    ctx->state[2] += c;
    ctx->state[3] += d;
    ctx->state[4] += e;
    ctx->state[5] += f;
    ctx->state[6] += g;
    ctx->state[7] += h;
}

static void sha256_init(sha256_ctx *ctx)
{
    ctx->datalen = 0;
    ctx->bitlen = 0;
    ctx->state[0] = 0x6a09e667;
    ctx->state[1] = 0xbb67ae85;
    ctx->state[2] = 0x3c6ef372;
    ctx->state[3] = 0xa54ff53a;
    ctx->state[4] = 0x510e527f;
    ctx->state[5] = 0x9b05688c;
    ctx->state[6] = 0x1f83d9ab;
    ctx->state[7] = 0x5be0cd19;
}

static void sha256_update(sha256_ctx *ctx, const uint8_t *data, size_t len)
{
    for (size_t i = 0; i < len; i++) {
        ctx->data[ctx->datalen++] = data[i];
        if (ctx->datalen == 64) {
            sha256_transform(ctx, ctx->data);
            ctx->bitlen += 512;
            ctx->datalen = 0;
        }
    }
}

static void sha256_final(sha256_ctx *ctx, uint8_t hash[32])
{
    ctx->bitlen += ctx->datalen * 8;

    ctx->data[ctx->datalen++] = 0x80;
    if (ctx->datalen > 56) {
        while (ctx->datalen < 64)
            ctx->data[ctx->datalen++] = 0;
        sha256_transform(ctx, ctx->data);
        ctx->datalen = 0;
    }
    while (ctx->datalen < 56)
        ctx->data[ctx->datalen++] = 0;

    for (int i = 7; i >= 0; i--) {
        ctx->data[ctx->datalen++] = (ctx->bitlen >> (i*8)) & 0xff;
    }
    sha256_transform(ctx, ctx->data);

    for (int i = 0; i < 8; i++) {
        hash[i*4]     = (ctx->state[i] >> 24) & 0xff;
        hash[i*4 + 1] = (ctx->state[i] >> 16) & 0xff;
        hash[i*4 + 2] = (ctx->state[i] >> 8) & 0xff;
        hash[i*4 + 3] = ctx->state[i] & 0xff;
    }
}

static void sha256(const void *data, size_t len, uint8_t hash[32])
{
    sha256_ctx ctx;
    sha256_init(&ctx);
    sha256_update(&ctx, data, len);
    sha256_final(&ctx, hash);
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

static void bytes_to_bn(struct bn *out, const uint8_t *bytes, size_t len)
{
    bignum_init(out);
    for (size_t i = 0; i < len; i++) {
        bignum_lshift(out, out, 8);
        struct bn tmp;
        bignum_from_int(&tmp, bytes[i]);
        bignum_or(out, &tmp, out);
    }
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

    uint8_t hash[32];
    sha256(data, size, hash);
    struct bn h;
    bytes_to_bn(&h, hash, 32);

    return bignum_cmp(&v, &h) == EQUAL;
}

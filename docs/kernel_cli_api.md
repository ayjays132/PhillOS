# Kernel CLI Query API

This document describes the experimental interface for querying
kernel state from the PhillOS command line tools.

The kernel exposes a simple syscall-like function `kernel_query()`
that validates a signed request and returns the requested data.

## Request Structure

```c
#include <stdint.h>

typedef enum {
    KERNEL_QUERY_HEAP_USAGE = 1,
    KERNEL_QUERY_SCHED_STATS = 2,
    KERNEL_QUERY_AI_HEAP_USAGE = 3,
} kernel_query_t;

typedef struct {
    uint32_t query;      // One of `kernel_query_t`
    uint32_t nonce;      // Random value supplied by caller
    uint32_t signature;  // see Signing below
} kernel_query_request_t;

typedef struct {
    uint64_t result;     // Query result value
} kernel_query_response_t;
```

## Signing

To prevent unauthorized access the kernel checks a signature for
each request.  A shared secret constant inside the kernel is combined
with the request `query` and `nonce` using a lightweight hash.  The
CLI must compute the same value:

```c
uint32_t sign_token(uint32_t nonce, uint32_t query) {
    uint32_t hash = SECRET ^ nonce ^ query;
    hash ^= 0x811C9DC5;
    hash *= 0x01000193;
    return hash;
}
```

Requests with an invalid signature are rejected.

## Supported Queries

* `KERNEL_QUERY_HEAP_USAGE` – returns the number of bytes currently
  allocated on the kernel heap.
* `KERNEL_QUERY_SCHED_STATS` – returns scheduler metrics packed into a
  64-bit value. The low 32 bits contain the number of active tasks and
  the high 32 bits encode the last residual from the UHS/HUQCE solver as
  a floating point value.
* `KERNEL_QUERY_AI_HEAP_USAGE` – bytes used in the agent heap.

## Example Flow

1. CLI generates a random `nonce` and computes `signature` with the
   shared secret.
2. It populates a `kernel_query_request_t` structure and issues the
   `kernel_query` call (via an ioctl or other mechanism).
3. If the signature matches, the kernel fills `kernel_query_response_t`
   with the requested value and returns `0`.
4. On failure the function returns `-1`.

The exact transport (ioctl, port I/O, etc.) is left to the host
environment.  Only authenticated requests receive a response.

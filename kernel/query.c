#include "query.h"
#include "memory/heap.h"

static const uint32_t TOKEN_SECRET = 0x5a17c3e4;

static uint32_t sign_token(uint32_t nonce, uint32_t query)
{
    uint32_t hash = TOKEN_SECRET ^ nonce ^ query;
    hash ^= 0x811C9DC5;
    hash *= 0x01000193;
    return hash;
}

int kernel_query(const kernel_query_request_t *req, kernel_query_response_t *res)
{
    if (!req || !res)
        return -1;
    if (req->signature != sign_token(req->nonce, req->query))
        return -1;
    switch (req->query) {
    case KERNEL_QUERY_HEAP_USAGE:
        res->result = heap_usage();
        return 0;
    default:
        return -1;
    }
}

#include "query.h"
#include "memory/heap.h"
#include "init.h"

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
    case KERNEL_QUERY_SCHED_STATS: {
        uint32_t count = (uint32_t)sched_task_count();
        union { uint32_t u; float f; } conv;
        conv.f = sched_last_residual();
        res->result = ((uint64_t)conv.u << 32) | count;
        return 0;
    }
    case KERNEL_QUERY_AI_HEAP_USAGE:
        res->result = agent_heap_usage();
        return 0;
    default:
        return -1;
    }
}

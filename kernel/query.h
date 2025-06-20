#ifndef PHILLOS_QUERY_H
#define PHILLOS_QUERY_H

#include <stdint.h>

typedef enum {
    KERNEL_QUERY_HEAP_USAGE = 1,
    KERNEL_QUERY_SCHED_STATS = 2,
    KERNEL_QUERY_AI_HEAP_USAGE = 3,
} kernel_query_t;

typedef struct {
    uint32_t query;
    uint32_t nonce;
    uint32_t signature;
} kernel_query_request_t;

typedef struct {
    uint64_t result;
} kernel_query_response_t;

int kernel_query(const kernel_query_request_t *req, kernel_query_response_t *res);

#endif // PHILLOS_QUERY_H

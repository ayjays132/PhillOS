#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <fcntl.h>
#include <unistd.h>
#include <sys/ioctl.h>
#include "query.h"

#define QUERY_DEV "/dev/phillos-query"

typedef struct {
    kernel_query_request_t req;
    kernel_query_response_t res;
    kernel_device_event_t event;
} query_ioc_t;

#define QUERY_IOCTL _IOWR('p', 1, query_ioc_t)

static uint32_t sign_token(uint32_t nonce, uint32_t query)
{
    uint32_t hash = 0x5a17c3e4 ^ nonce ^ query;
    hash ^= 0x811C9DC5;
    hash *= 0x01000193;
    return hash;
}

int main(int argc, char **argv)
{
    if (argc != 2) {
        fprintf(stderr, "Usage: %s <type>\n", argv[0]);
        return 1;
    }

    kernel_query_request_t req = {0};
    if (strcmp(argv[1], "heap") == 0) {
        req.query = KERNEL_QUERY_HEAP_USAGE;
    } else if (strcmp(argv[1], "sched") == 0) {
        req.query = KERNEL_QUERY_SCHED_STATS;
    } else if (strcmp(argv[1], "ai_heap") == 0) {
        req.query = KERNEL_QUERY_AI_HEAP_USAGE;
    } else if (strcmp(argv[1], "event") == 0) {
        req.query = KERNEL_QUERY_NEXT_DEVICE_EVENT;
    } else {
        fprintf(stderr, "Unknown query type\n");
        return 1;
    }

    req.nonce = (uint32_t)time(NULL);
    req.signature = sign_token(req.nonce, req.query);

    int fd = open(QUERY_DEV, O_RDWR);
    if (fd < 0) {
        perror("open");
        return 1;
    }

    query_ioc_t ioc;
    ioc.req = req;

    if (ioctl(fd, QUERY_IOCTL, &ioc) < 0) {
        perror("ioctl");
        close(fd);
        return 1;
    }

    close(fd);
    if (req.query == KERNEL_QUERY_SCHED_STATS) {
        uint32_t count = (uint32_t)(ioc.res.result & 0xFFFFFFFF);
        uint32_t bits = (uint32_t)(ioc.res.result >> 32);
        union { uint32_t u; float f; } conv;
        conv.u = bits;
        printf("tasks:%u residual:%f\n", count, conv.f);
    } else if (req.query == KERNEL_QUERY_NEXT_DEVICE_EVENT) {
        if (ioc.res.result) {
            printf("%s %04x:%04x bus %u slot %u func %u\n",
                   ioc.event.added ? "added" : "removed",
                   ioc.event.dev.vendor_id, ioc.event.dev.device_id,
                   ioc.event.dev.bus, ioc.event.dev.slot, ioc.event.dev.func);
        } else {
            printf("no event\n");
        }
    } else {
        printf("%llu\n", (unsigned long long)ioc.res.result);
    }
    return 0;
}

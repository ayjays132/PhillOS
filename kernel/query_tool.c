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
#define QUERY_IOCTL _IOWR('p', 1, struct query_ioc)

typedef struct {
    kernel_query_request_t req;
    kernel_query_response_t res;
} query_ioc_t;

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
    printf("%llu\n", (unsigned long long)ioc.res.result);
    return 0;
}

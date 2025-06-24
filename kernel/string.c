#include <stddef.h>
void *memset(void *dest, int c, size_t n) {
    unsigned char *d = dest;
    for (size_t i = 0; i < n; i++) d[i] = (unsigned char)c;
    return dest;
}
void *memcpy(void *dest, const void *src, size_t n) {
    unsigned char *d = dest;
    const unsigned char *s = src;
    for (size_t i = 0; i < n; i++) d[i] = s[i];
    return dest;
}
void *memmove(void *dest, const void *src, size_t n) {
    unsigned char *d = dest;
    const unsigned char *s = src;
    if (d < s) {
        for (size_t i = 0; i < n; i++) d[i] = s[i];
    } else if (d > s) {
        for (size_t i = n; i != 0; i--) d[i-1] = s[i-1];
    }
    return dest;
}

size_t strlen(const char *s) {
    size_t l = 0;
    while (s[l]) l++;
    return l;
}

int strcmp(const char *a, const char *b) {
    while (*a && *b && *a == *b) { a++; b++; }
    return (unsigned char)*a - (unsigned char)*b;
}

int strncmp(const char *a, const char *b, size_t n) {
    size_t i = 0;
    for (; i < n && a[i] && b[i]; i++) {
        if (a[i] != b[i])
            return (unsigned char)a[i] - (unsigned char)b[i];
    }
    if (i == n) return 0;
    return (unsigned char)a[i] - (unsigned char)b[i];
}

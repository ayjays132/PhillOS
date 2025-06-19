#include "debug.h"

static inline void outb(uint16_t port, uint8_t val) {
    __asm__ volatile("outb %0, %1" : : "a"(val), "Nd"(port));
}

void debug_putc(char c) {
    outb(0xE9, (uint8_t)c);
}

void debug_puts(const char *s) {
    while (*s)
        debug_putc(*s++);
}

void debug_puthex(uint32_t value) {
    const char hex[] = "0123456789ABCDEF";
    for (int i = 28; i >= 0; i -= 4)
        debug_putc(hex[(value >> i) & 0xF]);
}

void debug_puthex64(uint64_t value) {
    debug_puthex((uint32_t)(value >> 32));
    debug_puthex((uint32_t)value);
}

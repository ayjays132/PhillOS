#ifndef PHILLOS_DEBUG_H
#define PHILLOS_DEBUG_H

#include <stdint.h>

void debug_putc(char c);
void debug_puts(const char *s);
void debug_puthex(uint32_t value);
void debug_puthex64(uint64_t value);

#endif // PHILLOS_DEBUG_H

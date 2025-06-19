#ifndef PHILLOS_FRAMEBUFFER_H
#define PHILLOS_FRAMEBUFFER_H

#include <stdint.h>

void init_framebuffer(void);
void fb_draw_pixel(uint32_t x, uint32_t y, uint32_t color);

uint64_t fb_get_base(void);
uint64_t fb_get_size(void);
uint32_t fb_get_width(void);
uint32_t fb_get_height(void);

#endif // PHILLOS_FRAMEBUFFER_H

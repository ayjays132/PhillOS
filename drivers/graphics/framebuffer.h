#ifndef PHILLOS_FRAMEBUFFER_H
#define PHILLOS_FRAMEBUFFER_H

#include <stdint.h>

#include "../../kernel/boot_info.h"

void init_framebuffer(framebuffer_info_t *info);
void fb_draw_pixel(uint32_t x, uint32_t y, uint32_t color);
void fb_draw_line(uint32_t x0, uint32_t y0, uint32_t x1, uint32_t y1,
                  uint32_t color);
void fb_fill_rect(uint32_t x, uint32_t y, uint32_t w, uint32_t h,
                  uint32_t color);
void fb_draw_rect(uint32_t x, uint32_t y, uint32_t w, uint32_t h,
                  uint32_t color);
void fb_draw_char(uint32_t x, uint32_t y, char c,
                  uint32_t fg, uint32_t bg);
void fb_draw_text(uint32_t x, uint32_t y, const char *s,
                  uint32_t fg, uint32_t bg);

uint64_t fb_get_base(void);
uint64_t fb_get_size(void);
uint32_t fb_get_width(void);
uint32_t fb_get_height(void);
uint32_t fb_get_pitch(void);

#endif // PHILLOS_FRAMEBUFFER_H

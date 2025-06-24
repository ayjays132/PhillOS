#ifndef PHILLOS_GFX_H
#define PHILLOS_GFX_H

#include <stdint.h>

typedef struct gfx_surface {
    uint32_t width;
    uint32_t height;
    uint32_t pitch;
    uint32_t *pixels;
} gfx_surface_t;

typedef struct gfx_device {
    void (*present_frame)(gfx_surface_t *surf);
    gfx_surface_t *(*create_surface)(uint32_t width, uint32_t height);
    void (*draw_rect)(gfx_surface_t *surf,
                      uint32_t x, uint32_t y,
                      uint32_t w, uint32_t h,
                      uint32_t color);
} gfx_device_t;

#endif // PHILLOS_GFX_H

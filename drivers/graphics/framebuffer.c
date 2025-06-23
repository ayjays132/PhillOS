#include "framebuffer.h"
#include "gfx.h"
#include "gpu.h"
#include "../../kernel/boot_info.h"
#include "../../kernel/memory/paging.h"
#include "../../kernel/memory/heap.h"
#include "../../kernel/debug.h"
#include "font8x8_basic.h"
#include <string.h>

static uint8_t *fb_ptr = NULL;
static uint64_t fb_base = 0;
static uint64_t fb_size = 0;
static uint32_t fb_width = 0;
static uint32_t fb_height = 0;
static uint32_t fb_pitch = 0;
static gfx_device_t fb_gfx_device;

void init_framebuffer(framebuffer_info_t *info)
{
    if (!info)
        return;

    fb_base = info->base;
    fb_size = info->size;
    fb_width = info->width;
    fb_height = info->height;
    fb_pitch = info->pitch;

    if (paging_is_initialized()) {
        map_identity_range(fb_base, fb_size);
        fb_ptr = (uint8_t*)(uintptr_t)fb_base;
    } else {
        debug_puts("paging not initialized, framebuffer not mapped\n");
        fb_ptr = NULL;
    }

    debug_puts("GOP framebuffer base=");
    debug_puthex64(fb_base);
    debug_puts(" size=");
    debug_puthex64(fb_size);
    debug_puts(" res=");
    debug_puthex(fb_width);
    debug_putc('x');
    debug_puthex(fb_height);
    debug_putc('\n');

    gpu_set_active_gfx_device(&fb_gfx_device);
}

void fb_draw_pixel(uint32_t x, uint32_t y, uint32_t color)
{
    if (!fb_ptr)
        return;
    if (x >= fb_width || y >= fb_height)
        return;

    uint32_t *pixel = (uint32_t*)(fb_ptr + (y * fb_pitch + x) * 4);
    *pixel = color;
}

void fb_clear(uint32_t color)
{
    if (!fb_ptr)
        return;
    for (uint32_t y = 0; y < fb_height; y++) {
        uint32_t *row = (uint32_t*)(fb_ptr + y * fb_pitch * 4);
        for (uint32_t x = 0; x < fb_width; x++)
            row[x] = color;
    }
}

uint64_t fb_get_base(void) { return fb_base; }
uint64_t fb_get_size(void) { return fb_size; }
uint32_t fb_get_width(void) { return fb_width; }
uint32_t fb_get_height(void) { return fb_height; }
uint32_t fb_get_pitch(void) { return fb_pitch; }

// GPU vendor detection implemented in gpu.c.
// Future work will load vendor-specific drivers based on the detected GPU.

void fb_draw_line(uint32_t x0, uint32_t y0, uint32_t x1, uint32_t y1,
                  uint32_t color)
{
    if (!fb_ptr)
        return;

    int dx = (int)x1 - (int)x0;
    int dy = (int)y1 - (int)y0;
    int sx = dx >= 0 ? 1 : -1;
    int sy = dy >= 0 ? 1 : -1;
    dx = dx >= 0 ? dx : -dx;
    dy = dy >= 0 ? dy : -dy;

    int err = (dx > dy ? dx : -dy) / 2;
    while (1) {
        fb_draw_pixel(x0, y0, color);
        if (x0 == x1 && y0 == y1)
            break;
        int e2 = err;
        if (e2 > -dx) { err -= dy; x0 += sx; }
        if (e2 < dy)  { err += dx; y0 += sy; }
    }
}

void fb_fill_rect(uint32_t x, uint32_t y, uint32_t w, uint32_t h,
                  uint32_t color)
{
    if (!fb_ptr)
        return;

    for (uint32_t j = 0; j < h; j++) {
        if (y + j >= fb_height)
            break;
        uint32_t *row = (uint32_t*)(fb_ptr + ((y + j) * fb_pitch + x) * 4);
        for (uint32_t i = 0; i < w && x + i < fb_width; i++)
            row[i] = color;
    }
}

void fb_draw_rect(uint32_t x, uint32_t y, uint32_t w, uint32_t h,
                  uint32_t color)
{
    fb_draw_line(x, y, x + w - 1, y, color);
    fb_draw_line(x, y, x, y + h - 1, color);
    fb_draw_line(x + w - 1, y, x + w - 1, y + h - 1, color);
    fb_draw_line(x, y + h - 1, x + w - 1, y + h - 1, color);
}

void fb_draw_circle(uint32_t x0, uint32_t y0, uint32_t r, uint32_t color)
{
    if (!fb_ptr)
        return;
    int x = r;
    int y = 0;
    int err = 0;
    while (x >= y) {
        fb_draw_pixel(x0 + x, y0 + y, color);
        fb_draw_pixel(x0 + y, y0 + x, color);
        fb_draw_pixel(x0 - y, y0 + x, color);
        fb_draw_pixel(x0 - x, y0 + y, color);
        fb_draw_pixel(x0 - x, y0 - y, color);
        fb_draw_pixel(x0 - y, y0 - x, color);
        fb_draw_pixel(x0 + y, y0 - x, color);
        fb_draw_pixel(x0 + x, y0 - y, color);
        y++;
        if (err <= 0) {
            err += 2 * y + 1;
        }
        if (err > 0) {
            x--;
            err -= 2 * x + 1;
        }
    }
}

void fb_draw_char(uint32_t x, uint32_t y, char c,
                  uint32_t fg, uint32_t bg)
{
    if (!fb_ptr)
        return;
    const unsigned char *glyph = font8x8_basic[(unsigned char)c];
    for (uint32_t j = 0; j < 8; j++) {
        for (uint32_t i = 0; i < 8; i++) {
            uint32_t color = (glyph[j] & (1 << i)) ? fg : bg;
            if (color != 0xFFFFFFFF)
                fb_draw_pixel(x + i, y + j, color);
        }
    }
}

void fb_draw_text(uint32_t x, uint32_t y, const char *s,
                  uint32_t fg, uint32_t bg)
{
    while (*s) {
        fb_draw_char(x, y, *s++, fg, bg);
        x += 8;
    }
}

void fb_update_pointer_sprite(uint32_t x, uint32_t y,
                              const uint32_t *sprite,
                              uint32_t w, uint32_t h)
{
    if (!fb_ptr || !sprite)
        return;
    for (uint32_t j = 0; j < h; j++) {
        if (y + j >= fb_height)
            break;
        uint32_t *dst = (uint32_t *)(fb_ptr + ((y + j) * fb_pitch + x) * 4);
        const uint32_t *src = sprite + j * w;
        for (uint32_t i = 0; i < w && x + i < fb_width; i++) {
            uint32_t pix = src[i];
            if ((pix >> 24) != 0)
                dst[i] = pix;
        }
    }
}

/* --- gfx_device_t fallback implementation --- */

static gfx_surface_t *fb_create_surface(uint32_t w, uint32_t h)
{
    gfx_surface_t *surf = kmalloc(sizeof(gfx_surface_t));
    if (!surf)
        return NULL;
    surf->width = w;
    surf->height = h;
    surf->pitch = w;
    surf->pixels = kmalloc((size_t)w * h * 4);
    if (!surf->pixels) {
        kfree(surf);
        return NULL;
    }
    memset(surf->pixels, 0, (size_t)w * h * 4);
    return surf;
}

static void fb_surface_draw_rect(gfx_surface_t *surf,
                                 uint32_t x, uint32_t y,
                                 uint32_t w, uint32_t h,
                                 uint32_t color)
{
    if (!surf || !surf->pixels)
        return;
    for (uint32_t j = 0; j < h && y + j < surf->height; j++) {
        uint32_t *row = surf->pixels + (y + j) * surf->pitch + x;
        for (uint32_t i = 0; i < w && x + i < surf->width; i++)
            row[i] = color;
    }
}

static void fb_present_frame(gfx_surface_t *surf)
{
    if (!surf || !surf->pixels || !fb_ptr)
        return;
    uint32_t copy_w = surf->width < fb_width ? surf->width : fb_width;
    uint32_t copy_h = surf->height < fb_height ? surf->height : fb_height;
    for (uint32_t j = 0; j < copy_h; j++) {
        memcpy(fb_ptr + j * fb_pitch * 4,
               surf->pixels + j * surf->pitch,
               copy_w * 4);
    }
}

static gfx_device_t fb_gfx_device = {
    .present_frame = fb_present_frame,
    .create_surface = fb_create_surface,
    .draw_rect = fb_surface_draw_rect,
};

gfx_device_t *framebuffer_get_gfx_device(void)
{
    return &fb_gfx_device;
}

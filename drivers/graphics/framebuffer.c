#include "framebuffer.h"
#include <efi.h>
#include <efilib.h>
#include "../../kernel/memory/paging.h"
#include "../../kernel/debug.h"

static EFI_GRAPHICS_OUTPUT_PROTOCOL *gop = NULL;
static uint8_t *fb_ptr = NULL;
static uint64_t fb_base = 0;
static uint64_t fb_size = 0;
static uint32_t fb_width = 0;
static uint32_t fb_height = 0;
static uint32_t fb_pitch = 0;

void init_framebuffer(void)
{
    EFI_GUID gop_guid = EFI_GRAPHICS_OUTPUT_PROTOCOL_GUID;
    EFI_STATUS status = ST->BootServices->LocateProtocol(&gop_guid, NULL, (void**)&gop);
    if (EFI_ERROR(status) || !gop)
        return;

    fb_base = gop->Mode->FrameBufferBase;
    fb_size = gop->Mode->FrameBufferSize;
    fb_width = gop->Mode->Info->HorizontalResolution;
    fb_height = gop->Mode->Info->VerticalResolution;
    fb_pitch = gop->Mode->Info->PixelsPerScanLine;

    map_identity_range(fb_base, fb_size);
    fb_ptr = (uint8_t*)(uintptr_t)fb_base;

    debug_puts("GOP framebuffer base=");
    debug_puthex64(fb_base);
    debug_puts(" size=");
    debug_puthex64(fb_size);
    debug_puts(" res=");
    debug_puthex(fb_width);
    debug_putc('x');
    debug_puthex(fb_height);
    debug_putc('\n');
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

uint64_t fb_get_base(void) { return fb_base; }
uint64_t fb_get_size(void) { return fb_size; }
uint32_t fb_get_width(void) { return fb_width; }
uint32_t fb_get_height(void) { return fb_height; }
uint32_t fb_get_pitch(void) { return fb_pitch; }

// GPU vendor detection implemented in gpu.c.
// Future work will load vendor-specific drivers based on the detected GPU.

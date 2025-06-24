# Graphics Drivers

This directory contains the basic framebuffer driver and GPU detection code.

## GPU Detection

The `gpu.c` driver scans the PCI bus to identify attached display controllers.
If the vendor ID matches Nvidia (`0x10DE`), AMD (`0x1002`), or Intel (`0x8086`),
the detected vendor is returned for use by the kernel.

## Vendor-Specific Drivers

In addition to the generic framebuffer driver the tree now ships simple
implementations for Nvidia, AMD and Intel GPUs. After a PCI scan identifies a
supported device the matching source file programs a few common registers,
selects an initial display mode and exposes hooks so the Vulkan loader can use
the hardware. Unsupported vendors fall back to the EFI framebuffer.

## Initialization Flow

`init_gpu_driver()` performs a PCI scan and selects a vendor specific driver
when an Nvidia, AMD or Intel device is discovered.  The implementation now
initializes the GPU's registers, configures the detected mode and exposes
acceleration hooks so Vulkan or vkd3d can talk to the hardware. Each driver
still maps the framebuffer BAR and calls the generic `init_framebuffer()` helper
so early graphics output continues to work. The active driver can be queried
with `gpu_get_active_driver()`.

## Supported Hardware

PhillOS currently supports basic initialization for discrete Nvidia and AMD GPUs
as well as integrated Intel graphics. The drivers map the framebuffer BAR,
program a handful of registers and expose Vulkan acceleration hooks. Devices are
matched solely by PCI vendor ID:

- Nvidia (`0x10DE`)
- AMD/ATI (`0x1002`)
- Intel (`0x8086`)

Other GPUs fall back to the EFI framebuffer driver.

## Framebuffer Helpers

Alongside vendor detection the generic framebuffer now exposes a few simple
drawing primitives. `fb_draw_pixel()` sets an individual pixel, while the new
`fb_draw_line()`, `fb_draw_rect()` and `fb_fill_rect()` helpers allow basic
line and rectangle rendering directly in kernel space. These are intended for
early boot diagnostics and simple UI prototypes until a full graphics stack is
available.

### Text Output

The framebuffer driver now bundles a tiny 8x8 bitmap font derived from
public domain sources. `fb_draw_char()` renders a single ASCII character and
`fb_draw_text()` draws a string using this font. Passing `0xFFFFFFFF` as the
background color leaves untouched pixels unchanged, enabling simple overlay text
like the "OFFLINE MODE" banner shown during kernel initialization.

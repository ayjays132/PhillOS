# Graphics Drivers

This directory contains the basic framebuffer driver and GPU detection code.

## GPU Detection

The `gpu.c` driver scans the PCI bus to identify attached display controllers.
If the vendor ID matches Nvidia (`0x10DE`), AMD (`0x1002`), or Intel (`0x8086`),
the detected vendor is returned for use by the kernel.

## Future Vendor-Specific Drivers

Currently only a generic framebuffer is used. In the future the plan is to load
specialized drivers based on the detected GPU vendor. Once a PCI scan
identifies an Nvidia, AMD, or Intel device, a corresponding driver module will
be loaded to provide accelerated graphics. Other vendors will fall back to the
EFI framebuffer. This directory now contains stub driver structures for each
vendor that will be expanded in later revisions.

## Initialization Flow

`init_gpu_driver()` performs a PCI scan and selects a vendor specific driver
when an Nvidia, AMD or Intel device is discovered.  Each driver stub now probes
its device's BAR registers, maps the framebuffer region and then calls the
generic `init_framebuffer()` helper so early graphics output continues to work.
The active driver can be queried with `gpu_get_active_driver()`.

## Supported Hardware

PhillOS currently supports basic initialization for discrete Nvidia and AMD GPUs
as well as integrated Intel graphics.  The drivers map the framebuffer BAR and
enable a simple linear framebuffer.  Devices are matched solely by PCI vendor
ID:

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

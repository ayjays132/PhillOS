# Graphics Drivers

This directory contains the basic framebuffer driver and GPU detection code. A
new generic driver manager allows each vendor implementation to register itself
for plug‑and‑play style initialization.

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

At boot `driver_init_all()` iterates over all registered drivers.  Each GPU
driver exposes a `probe()` callback that checks for its hardware and an
`init()` function that sets up the framebuffer.  The helper
`gpu_set_active_driver()` records which driver succeeded so the rest of the
kernel can query it through `gpu_get_active_driver()`.

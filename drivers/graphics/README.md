# Graphics Drivers

This directory contains the basic framebuffer driver and GPU detection code.

## GPU Detection

The `gpu.c` driver scans the PCI bus to identify attached display controllers.
If the vendor ID matches Nvidia (`0x10DE`) or AMD (`0x1002`), the detected
vendor is returned for use by the kernel.

## Future Vendor-Specific Drivers

Currently only a generic framebuffer is used. In the future the plan is to load
specialized drivers based on the detected GPU vendor. Once a PCI scan
identifies an Nvidia or AMD device, a corresponding driver module will be
loaded to provide accelerated graphics. Other vendors will fall back to the
EFI framebuffer.

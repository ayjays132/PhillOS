# Phone Drivers

This directory contains early stubs for phone related hardware support.

## SIM Access

`sim.c` initializes the SIM interface and exposes a helper to read the ICCID. No
real modem interactions are performed yet.

## Bluetooth Pairing

`bluetooth.c` sets up the Bluetooth stack and includes a placeholder function for
starting device pairing. It does not interact with hardware.

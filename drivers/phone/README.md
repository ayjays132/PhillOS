# Phone Drivers

This directory contains native drivers for phone related hardware support.

## SIM Access

`sim.c` opens the first available modem device and issues standard AT commands to
query the SIM ICCID and send SMS messages. The helper functions are used by the
phone bridge service and now operate on actual hardware when present.

## Bluetooth Pairing

`bluetooth.c` uses BlueZ's HCI APIs to power on the local adapter and enter
pairing mode. A driver entry is exposed so the kernel's driver manager can
automatically probe Bluetooth hardware.

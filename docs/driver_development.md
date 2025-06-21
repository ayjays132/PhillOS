# Driver Development Guide

This guide describes how to create kernel drivers for PhillOS using the built-in plug‑and‑play framework.

## Directory Layout

Source code for built-in drivers lives under the `drivers/` directory:

- `graphics/` – GPU stubs and the generic framebuffer driver.
- `storage/` – the AHCI storage driver.
- `phone/` – Bluetooth and SIM helpers used by the phone bridge.

Out‑of‑tree drivers can be compiled as ELF modules and placed in `/modules/` on the boot partition.

## Building a Driver Module

1. Implement your driver source and a small `Makefile` that produces a position independent object (`-fPIC`) and links it as a shared object with the `.ko` extension.
2. Copy the resulting `.ko` file into the boot image under `modules/` so the loader can find it.
3. Run the signing step described below when Secure Boot is enabled.

## Required Callbacks

Every driver must expose a global `driver_entry` structure of type `driver_t`:

```c
extern driver_t driver_entry;
```

The structure requires three callbacks:

- `match(const pci_device_t *dev)` – return non‑zero if the driver supports the given PCI device.
- `init(const pci_device_t *dev)` – perform hardware initialization after a successful match.
- `teardown(uint8_t bus, uint8_t slot, uint8_t func)` – release resources when the device is removed or the module unloads.

The driver manager calls `match` and `init` during PCI scanning. When a device disappears `teardown` is invoked before the module is unloaded.

## Signing Modules

When Secure Boot is active, the kernel only loads modules signed with a trusted private key. Modules must now contain a 256‑byte RSA‑2048 signature. Use the helper script to sign a module:

```bash
scripts/sign_module.py privkey.pem mydriver.ko
```

`verify_module_signature()` in `kernel/security/signature.c` checks this trailer before loading the module. Unsigned or mismatched modules will be rejected.

## eBPF-Based Anomaly Detection

PhillOS can monitor system calls using eBPF programs. Compile the probes with `clang` targeting the `bpf` backend and place the resulting `.bpf.o` files under a top level `bpf/` directory. When building the kernel pass `INCLUDE_BPF=1` to copy these objects into `/lib/phillos/`:

```bash
clang -target bpf -O2 -c drivers/security/bpf/anomaly.bpf.c -o bpf/anomaly.bpf.o
make -C bootloader INCLUDE_BPF=1
```

If `INCLUDE_BPF` is omitted the kernel still builds, but the anomaly driver falls back to a basic syscall predictor when eBPF support is unavailable.


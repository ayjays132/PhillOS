# Building the Bootloader & Kernel

This project includes a simple UEFI bootloader and kernel written in C. Building them requires a cross toolchain and several EFI utilities.

## Required Packages

Ensure the following packages are installed on your system:

- `make`
- `x86_64-elf-gcc` and `x86_64-elf-binutils`
- `gnu-efi`
- `dosfstools` (provides `mkfs.fat`)
- `mtools` (provides `mcopy` and `mmd`)
- `grub-mkrescue`

Package names vary by distribution. Example commands:

```bash
# Debian / Ubuntu
sudo apt install make mtools dosfstools grub-efi-amd64-bin \
    grub-common binutils gnu-efi x86_64-elf-gcc

# Arch Linux
sudo pacman -S make mtools dosfstools grub x86_64-elf-gcc \
    x86_64-elf-binutils gnu-efi

# Fedora
sudo dnf install make mtools dosfstools grub2-tools \
    x86_64-elf-gcc binutils gnu-efi
```

If your distribution does not provide `x86_64-elf-gcc`, you can build it from source using a standard cross-compiler build script.

## Verifying the Toolchain

After installation, verify that the cross compiler is available in `PATH`:

```bash
$ x86_64-elf-gcc --version
$ which x86_64-elf-gcc
```

Both commands should succeed. If not, review your install steps or adjust your environment.

Before the first build run `./scripts/setup-vkd3d.sh` to fetch the vkd3d-proton sources. They are cached under `external/vkd3d` so subsequent builds work offline.

If you plan to use the WASM AI models, compile them once before building the
rest of the project:

```bash
npm run build-wasm
```

This step invokes the `onnxruntime-web` and `ggml` toolchains (when installed)
and places `summarizer.onnx.wasm` and `classifier.ggml.wasm` in `src/wasm/`.

## Building

With the prerequisites installed, run the top-level build script:

```bash
./scripts/build.sh
```

Bootloader artifacts are placed in `dist/bootloader` and the web UI build is written directly to `dist/`.

### Embedding the boot animation

`scripts/embed_svg.py` compresses a source SVG and appends the special
`PHILSVG\x00` trailer the loader checks for.  Run it whenever you update the
animation:

```bash
python3 scripts/embed_svg.py bootloader/bootanim.svg dist/bootloader/bootanim.svgz
```

If Secure Boot is enabled, sign the resulting blob so the firmware will load it:

```bash
sbsign --key keys/db.key --cert keys/db.crt dist/bootloader/bootanim.svgz
```

`phill_svg_loader.c` loads this file at boot. When `nomodeset` is present or the
Graphics Output Protocol is unavailable it falls back to `bootanim_sprite.svgz`.
If `theme.cfg` contains `light` or `dark` the loader first looks for
`bootanim_light.svgz` or `bootanim_dark.svgz` respectively:

```c
load_boot_animation(image, cmdline, boot_info->theme_dark,
                   &svg_data, &svg_size,
                   &sprite_data, &sprite_size);  /* from phill_svg_loader.c */
```

The animation can access metrics updated in `phill_svg_update.c` by calling
`SVG_BOOT_UPDATE()` from JavaScript.  Metrics such as PCR digest, CPU
temperature and fan RPM are exposed through this function and updated at key
points during `main.c`.

When creating the SVG consider the `theme_dark` flag from `boot_info_t` and
define both light and dark gradients so the loader can toggle them based on the
`theme.cfg` setting.

## Querying Kernel Metrics

After building the bootloader and kernel you can inspect runtime metrics via the
`phillos-cli` tool. A small helper under `kernel/` issues the signed ioctl
described in `docs/kernel_cli_api.md`.

Compile the utility:

```bash
make -C kernel
```

Query the current heap usage:

```bash
./dist/phillos-cli kernel query heap
```

The command prints the number of bytes currently allocated on the kernel heap.

### Testing the Memory Allocator

A small test under `tests/kernel_memory/` links against `heap.c` and `alloc.c`
to verify allocation and free logic. Build and run it with:

```bash
make -C tests/kernel_memory
./tests/kernel_memory/heap_test
```

If the output is `kernel memory tests passed` the allocator behaved as expected.

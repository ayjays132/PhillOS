# vkd3d-proton Integration

PhillOS relies on the open source [vkd3d-proton](https://github.com/HansKristian-Work/vkd3d-proton) project to translate DirectX 12 commands into Vulkan.

## Setup

Run `./scripts/setup-vkd3d.sh` once to download the sources. The script places them in `external/vkd3d` so future builds work entirely offline. If the directory already exists the script does nothing.

## Usage with Native Applications

Native Linux titles that use DirectX 12 can load `libvkd3d-proton.so` from `/usr/lib/phillos/vkd3d` or preload it with `LD_PRELOAD` to translate their graphics calls.

## Usage with Proton/Wine

When starting Windows games through Proton or Wine the launcher sets the `VKD3D_CONFIG` environment variable to point at the same library directory. Proton automatically uses it to translate DirectX 12 to Vulkan, enabling offline gameplay once the library is installed.

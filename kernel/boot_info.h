#ifndef PHILLOS_BOOT_INFO_H
#define PHILLOS_BOOT_INFO_H
#include <stdint.h>

typedef enum {
    GPU_VENDOR_UNKNOWN = 0,
    GPU_VENDOR_NVIDIA,
    GPU_VENDOR_AMD,
    GPU_VENDOR_INTEL
} gpu_vendor_t;

typedef struct {
    uint64_t base;
    uint64_t size;
    uint32_t width;
    uint32_t height;
    uint32_t pitch;
} framebuffer_info_t;

typedef struct {
    uint32_t Type;
    uint32_t Pad;
    uint64_t PhysicalStart;
    uint64_t VirtualStart;
    uint64_t NumberOfPages;
    uint64_t Attribute;
} efi_memory_descriptor_t;

typedef struct {
    uint64_t mmap_size;
    uint64_t mmap_desc_size;
    uint64_t mmap_key; // used by bootloader
    efi_memory_descriptor_t *mmap;
    framebuffer_info_t fb;
    uint64_t ai_base;
    uint64_t ai_size;
    uint64_t svg_base;
    uint64_t svg_size;
    uint64_t sprite_base;
    uint64_t sprite_size;
    uint64_t cursor_base;
    uint64_t cursor_size;
    uint8_t  theme_dark; // 1 = dark, 0 = light
    uint8_t  offline;    // 1 = offline mode
    uint8_t  gpu_override; // GPU_VENDOR_* value or GPU_VENDOR_UNKNOWN for auto
    uint32_t display_width;  // 0 = use GOP mode
    uint32_t display_height; // 0 = use GOP mode
    uint32_t display_refresh; // Hz, 0 = default
    char cmdline[128];
} boot_info_t;

#endif // PHILLOS_BOOT_INFO_H

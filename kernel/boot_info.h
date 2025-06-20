#ifndef PHILLOS_BOOT_INFO_H
#define PHILLOS_BOOT_INFO_H
#include <stdint.h>

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
    char cmdline[128];
} boot_info_t;

#endif // PHILLOS_BOOT_INFO_H

#ifndef PHILL_SVG_LOADER_H
#define PHILL_SVG_LOADER_H
#include <efi.h>
#include <efilib.h>

EFI_STATUS load_boot_animation(EFI_HANDLE image, const char *cmdline,
                               VOID **svg_data, UINTN *svg_size,
                               VOID **sprite_data, UINTN *sprite_size);

#endif // PHILL_SVG_LOADER_H

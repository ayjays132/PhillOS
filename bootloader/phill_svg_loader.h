#ifndef PHILL_SVG_LOADER_H
#define PHILL_SVG_LOADER_H
#include <efi.h>
#include <efilib.h>

EFI_STATUS load_boot_animation(EFI_HANDLE image, const char *cmdline,
                               UINT8 theme_dark,
                               VOID **svg_data, UINTN *svg_size,
                               VOID **sprite_data, UINTN *sprite_size);

EFI_STATUS load_boot_cursor(EFI_HANDLE image, UINT8 theme_dark,
                            VOID **cursor_data, UINTN *cursor_size);

#endif // PHILL_SVG_LOADER_H

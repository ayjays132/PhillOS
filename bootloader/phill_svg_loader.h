#ifndef PHILL_SVG_LOADER_H
#define PHILL_SVG_LOADER_H
#include <efi.h>
#include <efilib.h>

EFI_STATUS load_svg_animation(EFI_HANDLE image, VOID **data, UINTN *size);

#endif // PHILL_SVG_LOADER_H

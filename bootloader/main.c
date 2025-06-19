#include <efi.h>
#include <efilib.h>
#include "init.h"

EFI_STATUS
EFIAPI
efi_main (EFI_HANDLE ImageHandle, EFI_SYSTEM_TABLE *SystemTable) {
    InitializeLib(ImageHandle, SystemTable);
    Print(L"Hello from PhillOS UEFI bootloader!\n");
    kernel_main();
    return EFI_SUCCESS;
}

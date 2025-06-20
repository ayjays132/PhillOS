#include "phill_svg_loader.h"

EFI_STATUS load_svg_animation(EFI_HANDLE image, VOID **data, UINTN *size) {
    EFI_STATUS status;
    EFI_LOADED_IMAGE *loaded_image;
    EFI_GUID li_guid = EFI_LOADED_IMAGE_PROTOCOL_GUID;
    status = uefi_call_wrapper(BS->HandleProtocol, 3, image, &li_guid, (void**)&loaded_image);
    if (EFI_ERROR(status))
        return status;

    EFI_SIMPLE_FILE_SYSTEM_PROTOCOL *fs;
    EFI_GUID fs_guid = EFI_SIMPLE_FILE_SYSTEM_PROTOCOL_GUID;
    status = uefi_call_wrapper(BS->HandleProtocol, 3, loaded_image->DeviceHandle, &fs_guid, (void**)&fs);
    if (EFI_ERROR(status))
        return status;

    EFI_FILE_PROTOCOL *root;
    status = uefi_call_wrapper(fs->OpenVolume, 2, fs, &root);
    if (EFI_ERROR(status))
        return status;

    EFI_FILE_PROTOCOL *file;
    status = uefi_call_wrapper(root->Open, 5, root, &file, L"\\EFI\\PHILLOS\\bootanim.svgz", EFI_FILE_MODE_READ, 0);
    if (EFI_ERROR(status))
        return status;

    EFI_GUID info_guid = EFI_FILE_INFO_ID;
    UINTN info_size = SIZE_OF_EFI_FILE_INFO + 200;
    EFI_FILE_INFO *info;
    status = uefi_call_wrapper(BS->AllocatePool, 3, EfiLoaderData, info_size, (void**)&info);
    if (EFI_ERROR(status)) {
        file->Close(file);
        return status;
    }

    status = uefi_call_wrapper(file->GetInfo, 4, file, &info_guid, &info_size, info);
    if (EFI_ERROR(status)) {
        BS->FreePool(info);
        file->Close(file);
        return status;
    }

    UINTN file_size = info->FileSize;
    BS->FreePool(info);

    VOID *buf;
    status = uefi_call_wrapper(BS->AllocatePool, 3, EfiLoaderData, file_size, &buf);
    if (EFI_ERROR(status)) {
        file->Close(file);
        return status;
    }

    UINTN read_size = file_size;
    status = uefi_call_wrapper(file->Read, 3, file, &read_size, buf);
    file->Close(file);
    if (EFI_ERROR(status) || read_size != file_size) {
        BS->FreePool(buf);
        return EFI_LOAD_ERROR;
    }

    if (file_size < 8 ||
        CompareMem((UINT8 *)buf + file_size - 8, "PHILSVG", 8) != 0) {
        BS->FreePool(buf);
        return EFI_LOAD_ERROR;
    }

    *data = buf;
    *size = file_size;
    return EFI_SUCCESS;
}

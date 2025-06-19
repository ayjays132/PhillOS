#include <efi.h>
#include <efilib.h>
#include "init.h"
#include "../kernel/boot_info.h"

static UINTN parse_ai_pages(const char *cmd)
{
    const char *p = cmd;
    while (*p) {
        while (*p == ' ')
            p++;
        if (!*p)
            break;
        if (p[0]=='a' && p[1]=='i' && p[2]=='_' && p[3]=='m' && p[4]=='e' && p[5]=='m' && p[6]=='=') {
            p += 7;
            UINTN val = 0;
            while (*p >= '0' && *p <= '9') {
                val = val * 10 + (*p - '0');
                p++;
            }
            if (*p=='G' || *p=='g') {
                val *= 256 * 1024;
            } else {
                /* default MiB */
                val *= 256;
            }
            return val;
        }
        while (*p && *p != ' ')
            p++;
    }
    return 0;
}

typedef struct {
    unsigned char e_ident[16];
    uint16_t e_type;
    uint16_t e_machine;
    uint32_t e_version;
    uint64_t e_entry;
    uint64_t e_phoff;
    uint64_t e_shoff;
    uint32_t e_flags;
    uint16_t e_ehsize;
    uint16_t e_phentsize;
    uint16_t e_phnum;
    uint16_t e_shentsize;
    uint16_t e_shnum;
    uint16_t e_shstrndx;
} Elf64_Ehdr;

typedef struct {
    uint32_t p_type;
    uint32_t p_flags;
    uint64_t p_offset;
    uint64_t p_vaddr;
    uint64_t p_paddr;
    uint64_t p_filesz;
    uint64_t p_memsz;
    uint64_t p_align;
} Elf64_Phdr;

#define PT_LOAD 1

static EFI_STATUS load_kernel(EFI_HANDLE image, void **entry)
{
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
    status = uefi_call_wrapper(root->Open, 5, root, &file, L"\\EFI\\PHILLOS\\kernel.elf", EFI_FILE_MODE_READ, 0);
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

    void *buf;
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

    Elf64_Ehdr *eh = (Elf64_Ehdr*)buf;
    Elf64_Phdr *ph = (Elf64_Phdr*)((UINT8*)buf + eh->e_phoff);

    for (UINT16 i = 0; i < eh->e_phnum; i++) {
        if (ph[i].p_type != PT_LOAD)
            continue;

        UINT64 dest = ph[i].p_paddr;
        UINTN pages = (ph[i].p_memsz + 4095) / 4096;
        status = uefi_call_wrapper(BS->AllocatePages, 4, AllocateAddress, EfiLoaderData, pages, &dest);
        if (EFI_ERROR(status)) {
            BS->FreePool(buf);
            return status;
        }

        CopyMem((void*)dest, (UINT8*)buf + ph[i].p_offset, ph[i].p_filesz);
        if (ph[i].p_memsz > ph[i].p_filesz)
            SetMem((void*)(dest + ph[i].p_filesz), ph[i].p_memsz - ph[i].p_filesz, 0);
    }

    *entry = (void*)eh->e_entry;
    BS->FreePool(buf);
    return EFI_SUCCESS;
}

static EFI_STATUS setup_kernel_stack(UINT64 *stack_top)
{
    UINT64 stack_base = 0x200000; /* 2 MiB */
    UINTN pages = 16; /* 64 KiB stack */
    EFI_STATUS status = uefi_call_wrapper(BS->AllocatePages, 4, AllocateAddress,
                                          EfiLoaderData, pages, &stack_base);
    if (EFI_ERROR(status)) {
        stack_base = 0;
        status = uefi_call_wrapper(BS->AllocatePages, 4, AllocateAnyPages,
                                   EfiLoaderData, pages, &stack_base);
        if (EFI_ERROR(status))
            return status;
    }

    *stack_top = stack_base + pages * 4096;
    return EFI_SUCCESS;
}
static EFI_STATUS prepare_boot_info(EFI_HANDLE image, boot_info_t **out_info)
{
    EFI_STATUS status;
    boot_info_t *info;

    status = uefi_call_wrapper(BS->AllocatePool, 3, EfiLoaderData,
                               sizeof(boot_info_t), (void **)&info);
    if (EFI_ERROR(status))
        return status;
    SetMem(info, 0, sizeof(boot_info_t));

    /* Obtain boot arguments early */
    EFI_LOADED_IMAGE *li;
    EFI_GUID li_guid = EFI_LOADED_IMAGE_PROTOCOL_GUID;
    status = uefi_call_wrapper(BS->HandleProtocol, 3, image, &li_guid, (void**)&li);
    char cmdline_buf[128];
    if (!EFI_ERROR(status) && li && li->LoadOptionsSize > 0) {
        UINTN count = li->LoadOptionsSize / sizeof(CHAR16);
        UINTN i;
        for (i = 0; i < count - 1 && i < sizeof(cmdline_buf) - 1; i++) {
            CHAR16 c = ((CHAR16*)li->LoadOptions)[i];
            if (c == L'\0')
                break;
            cmdline_buf[i] = (char)c;
        }
        cmdline_buf[i] = '\0';
    } else {
        cmdline_buf[0] = '\0';
    }
    CopyMem(info->cmdline, cmdline_buf, sizeof(info->cmdline));

    UINTN ai_pages = parse_ai_pages(cmdline_buf);
    if (ai_pages) {
        EFI_PHYSICAL_ADDRESS ai_base = 0;
        status = uefi_call_wrapper(BS->AllocatePages, 4, AllocateAnyPages,
                                   EfiLoaderData, ai_pages, &ai_base);
        if (!EFI_ERROR(status)) {
            info->ai_base = ai_base;
            info->ai_size = ai_pages * 4096;
        }
    }

    EFI_GUID gop_guid = EFI_GRAPHICS_OUTPUT_PROTOCOL_GUID;
    EFI_GRAPHICS_OUTPUT_PROTOCOL *gop;
    status = uefi_call_wrapper(BS->LocateProtocol, 3, &gop_guid, NULL, (void**)&gop);
    if (!EFI_ERROR(status) && gop) {
        info->fb.base = gop->Mode->FrameBufferBase;
        info->fb.size = gop->Mode->FrameBufferSize;
        info->fb.width = gop->Mode->Info->HorizontalResolution;
        info->fb.height = gop->Mode->Info->VerticalResolution;
        info->fb.pitch = gop->Mode->Info->PixelsPerScanLine;
    }

    UINTN map_size = 0, map_key, desc_size;
    UINT32 desc_ver;
    status = uefi_call_wrapper(BS->GetMemoryMap, 5, &map_size, NULL, &map_key, &desc_size, &desc_ver);
    if (status != EFI_BUFFER_TOO_SMALL)
        return status;

    map_size += desc_size * 8;
    efi_memory_descriptor_t *map;
    status = uefi_call_wrapper(BS->AllocatePool, 3, EfiLoaderData, map_size, (void**)&map);
    if (EFI_ERROR(status))
        return status;

    status = uefi_call_wrapper(BS->GetMemoryMap, 5, &map_size, (EFI_MEMORY_DESCRIPTOR*)map, &map_key, &desc_size, &desc_ver);
    if (EFI_ERROR(status))
        return status;

    info->mmap = map;
    info->mmap_size = map_size;
    info->mmap_desc_size = desc_size;
    info->mmap_key = map_key;

    *out_info = info;
    return EFI_SUCCESS;
}

static EFI_STATUS exit_boot(EFI_HANDLE image, boot_info_t *info)
{
    return uefi_call_wrapper(BS->ExitBootServices, 2, image, info->mmap_key);
}

EFI_STATUS EFIAPI efi_main (EFI_HANDLE ImageHandle, EFI_SYSTEM_TABLE *SystemTable) {
    InitializeLib(ImageHandle, SystemTable);
    Print(L"PhillOS bootloader loading kernel\n");

    void *entry = NULL;
    EFI_STATUS status = load_kernel(ImageHandle, &entry);
    if (EFI_ERROR(status)) {
        Print(L"Failed to load kernel: %r\n", status);
        return status;
    }

    UINT64 stack_top = 0;
    status = setup_kernel_stack(&stack_top);
    if (EFI_ERROR(status)) {
        Print(L"Failed to allocate kernel stack: %r\n", status);
        return status;
    }

    boot_info_t *boot_info = NULL;
    status = prepare_boot_info(ImageHandle, &boot_info);
    if (EFI_ERROR(status)) {
        Print(L"Failed to prepare boot info: %r\n", status);
        return status;
    }

    status = exit_boot(ImageHandle, boot_info);
    if (EFI_ERROR(status)) {
        Print(L"Failed to exit boot services: %r\n", status);
        return status;
    }

    void (*kernel_entry)(boot_info_t *) = entry;
    __asm__ volatile(
        "mov %0, %%rdi\n"
        "mov %1, %%rsp\n"
        "jmp *%2\n"
        :
        : "r"(boot_info), "r"(stack_top), "r"(kernel_entry)
        : "memory");

    return EFI_SUCCESS;
}

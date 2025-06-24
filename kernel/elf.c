#include "elf.h"
#include "memory/heap.h"
#include "debug.h"
#include <string.h>

/* ELF structures */
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

typedef struct {
    uint32_t st_name;
    unsigned char st_info;
    unsigned char st_other;
    uint16_t st_shndx;
    uint64_t st_value;
    uint64_t st_size;
} Elf64_Sym;

typedef struct {
    uint64_t r_offset;
    uint64_t r_info;
    int64_t  r_addend;
} Elf64_Rela;

typedef struct {
    int64_t d_tag;
    union {
        uint64_t d_val;
        uint64_t d_ptr;
    } d_un;
} Elf64_Dyn;

#define PT_LOAD    1
#define PT_DYNAMIC 2

#define DT_NULL    0
#define DT_HASH    4
#define DT_STRTAB  5
#define DT_SYMTAB  6
#define DT_RELA    7
#define DT_RELASZ  8
#define DT_RELAENT 9
#define DT_STRSZ   10
#define DT_SYMENT  11

#define R_X86_64_RELATIVE 8

#define ELF64_R_TYPE(i) ((uint32_t)(i))

int elf_load_image(const void *data, size_t size, elf_image_t *out)
{
    if (!data || !out || size < sizeof(Elf64_Ehdr))
        return -1;

    const Elf64_Ehdr *eh = (const Elf64_Ehdr *)data;
    if (eh->e_ident[0] != 0x7f || eh->e_ident[1] != 'E' ||
        eh->e_ident[2] != 'L' || eh->e_ident[3] != 'F')
        return -1;
    if (eh->e_ident[4] != 2) /* 64-bit */
        return -1;

    const Elf64_Phdr *ph = (const Elf64_Phdr *)((const unsigned char *)data + eh->e_phoff);

    uint64_t min_vaddr = ~(uint64_t)0;
    uint64_t max_vaddr = 0;
    for (uint16_t i = 0; i < eh->e_phnum; i++) {
        if (ph[i].p_type != PT_LOAD)
            continue;
        if (ph[i].p_vaddr < min_vaddr)
            min_vaddr = ph[i].p_vaddr;
        uint64_t end = ph[i].p_vaddr + ph[i].p_memsz;
        if (end > max_vaddr)
            max_vaddr = end;
    }
    if (max_vaddr <= min_vaddr)
        return -1;

    size_t mem_size = (size_t)(max_vaddr - min_vaddr);
    unsigned char *mem = kmalloc(mem_size);
    if (!mem)
        return -1;
    memset(mem, 0, mem_size);

    for (uint16_t i = 0; i < eh->e_phnum; i++) {
        if (ph[i].p_type != PT_LOAD)
            continue;
        memcpy(mem + (ph[i].p_vaddr - min_vaddr),
               (const unsigned char *)data + ph[i].p_offset,
               ph[i].p_filesz);
    }

    uint64_t bias = (uint64_t)mem - min_vaddr;

    const Elf64_Dyn *dyn = NULL;
    size_t dyn_count = 0;
    for (uint16_t i = 0; i < eh->e_phnum; i++) {
        if (ph[i].p_type == PT_DYNAMIC) {
            dyn = (const Elf64_Dyn *)(mem + (ph[i].p_vaddr - min_vaddr));
            dyn_count = ph[i].p_memsz / sizeof(Elf64_Dyn);
            break;
        }
    }

    Elf64_Rela *rela = NULL;
    size_t rela_cnt = 0;
    Elf64_Sym *symtab = NULL;
    const char *strtab = NULL;
    uint32_t *hash = NULL;

    if (dyn) {
        for (size_t i = 0; i < dyn_count; i++) {
            switch (dyn[i].d_tag) {
            case DT_RELA:
                rela = (Elf64_Rela *)(bias + dyn[i].d_un.d_ptr);
                break;
            case DT_RELASZ:
                rela_cnt = dyn[i].d_un.d_val / sizeof(Elf64_Rela);
                break;
            case DT_SYMTAB:
                symtab = (Elf64_Sym *)(bias + dyn[i].d_un.d_ptr);
                break;
            case DT_STRTAB:
                strtab = (const char *)(bias + dyn[i].d_un.d_ptr);
                break;
            case DT_HASH:
                hash = (uint32_t *)(bias + dyn[i].d_un.d_ptr);
                break;
            }
        }
    }

    for (size_t i = 0; i < rela_cnt; i++) {
        if (ELF64_R_TYPE(rela[i].r_info) == R_X86_64_RELATIVE) {
            uint64_t *loc = (uint64_t *)(bias + rela[i].r_offset);
            *loc = bias + rela[i].r_addend;
        }
    }

    uint32_t sym_cnt = 0;
    if (hash)
        sym_cnt = hash[1];

    out->base = mem;
    out->bias = bias;
    out->size = mem_size;
    out->symtab = symtab;
    out->strtab = strtab;
    out->sym_count = sym_cnt;
    return 0;
}

void *elf_lookup_symbol(const elf_image_t *img, const char *name)
{
    if (!img || !name || !img->symtab || !img->strtab)
        return NULL;

    const Elf64_Sym *symtab = (const Elf64_Sym *)img->symtab;
    for (uint32_t i = 0; i < img->sym_count; i++) {
        const char *sname = img->strtab + symtab[i].st_name;
        if (strcmp(sname, name) == 0)
            return (void *)(img->bias + symtab[i].st_value);
    }
    return NULL;
}

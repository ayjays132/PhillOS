#ifndef PHILLOS_ELF_H
#define PHILLOS_ELF_H

#include <stdint.h>
#include <stddef.h>

/* Basic ELF64 structures and loader for shared objects */

typedef struct {
    void *base;        /* loaded base address */
    uint64_t bias;     /* base - original min vaddr */
    size_t size;       /* size of allocated memory */
    void *symtab;      /* pointer to symbol table */
    const char *strtab;/* pointer to string table */
    uint32_t sym_count;/* number of symbols */
} elf_image_t;

int elf_load_image(const void *data, size_t size, elf_image_t *out);
void *elf_lookup_symbol(const elf_image_t *img, const char *name);

#endif /* PHILLOS_ELF_H */

#ifndef PHILLOS_FS_FAT32_H
#define PHILLOS_FS_FAT32_H
#include <stdint.h>
int fat32_init(void);
void *fat32_load_file(const char *path, uint32_t *size);
#endif // PHILLOS_FS_FAT32_H

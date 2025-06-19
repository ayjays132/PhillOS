#include "fat32.h"
#include "../debug.h"
#include "../memory/heap.h"
#include "../../drivers/storage/ahci.h"
#include <stddef.h>
#include <stdint.h>
#include <string.h>

/* Simple read-only FAT32 implementation sufficient to load files from the
 * boot partition. Only short file names and basic long file names are
 * supported. */

typedef struct {
    uint32_t fat_start;      // LBA of first FAT
    uint32_t data_start;     // LBA of first data sector
    uint32_t sectors_per_fat;
    uint32_t sectors_per_cluster;
    uint32_t bytes_per_sector;
    uint32_t root_cluster;
} fat32_fs_t;

static fat32_fs_t fs;

static int read_sectors(uint64_t lba, uint32_t count, void *buf)
{
    return ahci_read(lba, count, buf);
}

static uint32_t cluster_to_lba(uint32_t cluster)
{
    return fs.data_start + (cluster - 2) * fs.sectors_per_cluster;
}

static uint32_t fat_get_next(uint32_t cluster)
{
    uint32_t offset = cluster * 4;
    uint32_t sector = fs.fat_start + offset / fs.bytes_per_sector;
    uint32_t off = offset % fs.bytes_per_sector;
    uint8_t buf[4];
    if (read_sectors(sector, 1, buf))
        return 0x0FFFFFFF;
    uint32_t val = *(uint32_t *)(buf + off);
    return val & 0x0FFFFFFF;
}

int fat32_init(void)
{
    uint8_t bs[512];
    if (read_sectors(0, 1, bs))
        return -1;
    fs.bytes_per_sector = bs[11] | (bs[12] << 8);
    fs.sectors_per_cluster = bs[13];
    uint16_t reserved = bs[14] | (bs[15] << 8);
    uint8_t fats = bs[16];
    fs.sectors_per_fat = bs[36] | (bs[37] << 8) | (bs[38] << 16) | (bs[39] << 24);
    fs.root_cluster = bs[44] | (bs[45] << 8) | (bs[46] << 16) | (bs[47] << 24);
    fs.fat_start = reserved;
    fs.data_start = reserved + fats * fs.sectors_per_fat;
    if (!fs.bytes_per_sector || !fs.sectors_per_cluster)
        return -1;
    return 0;
}

/* simple util functions */
static size_t c_strlen(const char *s)
{
    size_t l = 0;
    while (s[l]) l++; return l;
}

static int c_strcmp(const char *a, const char *b)
{
    while (*a && *b && *a == *b) { a++; b++; }
    return (unsigned char)*a - (unsigned char)*b;
}

static int c_strcasecmp(const char *a, const char *b)
{
    while (*a && *b) {
        char ca = *a >= 'A' && *a <= 'Z' ? *a + 32 : *a;
        char cb = *b >= 'A' && *b <= 'Z' ? *b + 32 : *b;
        if (ca != cb) break;
        a++; b++;
    }
    char ca = *a >= 'A' && *a <= 'Z' ? *a + 32 : *a;
    char cb = *b >= 'A' && *b <= 'Z' ? *b + 32 : *b;
    return (unsigned char)ca - (unsigned char)cb;
}

static void shortname_to_str(const uint8_t *in, char *out)
{
    int i = 0, j = 0;
    for (i = 0; i < 8 && in[i] != ' '; i++)
        out[j++] = in[i];
    if (in[8] != ' ')
        out[j++] = '.';
    for (i = 8; i < 11 && in[i] != ' '; i++)
        out[j++] = in[i];
    out[j] = '\0';
}

typedef struct __attribute__((packed)) {
    uint8_t name[11];
    uint8_t attr;
    uint8_t ntres;
    uint8_t crtTimeTenth;
    uint16_t crtTime;
    uint16_t crtDate;
    uint16_t lstAccDate;
    uint16_t fstClusHI;
    uint16_t wrtTime;
    uint16_t wrtDate;
    uint16_t fstClusLO;
    uint32_t fileSize;
} fat_dir_entry_t;

typedef struct __attribute__((packed)) {
    uint8_t ord;
    uint16_t name1[5];
    uint8_t attr;
    uint8_t type;
    uint8_t checksum;
    uint16_t name2[6];
    uint16_t fstClusLO;
    uint16_t name3[2];
} fat_lfn_entry_t;

static int read_directory(uint32_t cluster, const char *name,
                          uint32_t *out_cluster, uint32_t *out_size, uint8_t *out_attr)
{
    uint32_t cur = cluster;
    char lfn[256];
    size_t lfn_len = 0;
    while (cur >= 2 && cur < 0x0FFFFFF8) {
        for (uint32_t sec = 0; sec < fs.sectors_per_cluster; sec++) {
            uint8_t buf[512];
            if (read_sectors(cluster_to_lba(cur) + sec, 1, buf))
                return -1;
            for (uint32_t off = 0; off < fs.bytes_per_sector; off += 32) {
                fat_dir_entry_t *ent = (fat_dir_entry_t *)(buf + off);
                if (ent->name[0] == 0x00) return -1; // end
                if (ent->name[0] == 0xE5) { lfn_len = 0; continue; }
                if (ent->attr == 0x0F) {
                    fat_lfn_entry_t *lfn_ent = (fat_lfn_entry_t *)ent;
                    int ord = lfn_ent->ord & 0x1F;
                    if (lfn_ent->ord & 0x40) {
                        lfn_len = ord * 13;
                        if (lfn_len > sizeof(lfn)-1) lfn_len = sizeof(lfn)-1;
                        for (size_t i = 0; i < lfn_len; i++) lfn[i] = '\0';
                    }
                    int start = (ord - 1) * 13;
                    for (int i = 0; i < 5 && start + i < sizeof(lfn)-1; i++) {
                        char c = lfn_ent->name1[i] & 0xFF;
                        if (!c) break; lfn[start+i] = c;
                    }
                    for (int i = 0; i < 6 && start + 5 + i < sizeof(lfn)-1; i++) {
                        char c = lfn_ent->name2[i] & 0xFF;
                        if (!c) break; lfn[start+5+i] = c;
                    }
                    for (int i = 0; i < 2 && start + 11 + i < sizeof(lfn)-1; i++) {
                        char c = lfn_ent->name3[i] & 0xFF;
                        if (!c) break; lfn[start+11+i] = c;
                    }
                } else {
                    char sname[64];
                    if (lfn_len)
                        strcpy(sname, lfn);
                    else
                        shortname_to_str(ent->name, sname);
                    if (c_strcasecmp(sname, name) == 0) {
                        uint32_t clus = ((uint32_t)ent->fstClusHI << 16) |
                                         ent->fstClusLO;
                        if (out_cluster) *out_cluster = clus;
                        if (out_size) *out_size = ent->fileSize;
                        if (out_attr) *out_attr = ent->attr;
                        return 0;
                    }
                    lfn_len = 0;
                }
            }
        }
        cur = fat_get_next(cur);
    }
    return -1;
}

void *fat32_load_file(const char *path, uint32_t *size)
{
    if (!path || path[0] != '/')
        return NULL;
    uint32_t cluster = fs.root_cluster;
    const char *p = path + 1;
    char name[256];
    while (*p) {
        size_t i = 0;
        while (p[i] && p[i] != '/' && i < sizeof(name)-1) {
            name[i] = p[i];
            i++;
        }
        name[i] = '\0';
        uint32_t next_cluster = 0, fsize = 0;
        uint8_t attr = 0;
        if (read_directory(cluster, name, &next_cluster, &fsize, &attr))
            return NULL;
        if (p[i] == '/') {
            if (!(attr & 0x10))
                return NULL; // not a directory
            cluster = next_cluster;
            p += i + 1;
        } else {
            if (attr & 0x10)
                return NULL; // is a directory
            cluster = next_cluster;
            if (size) *size = fsize;
            break;
        }
    }
    if (!cluster)
        return NULL;
    uint32_t remaining = *size;
    uint8_t *buffer = kmalloc(remaining);
    if (!buffer) return NULL;
    uint8_t *ptr = buffer;
    uint32_t cur = cluster;
    while (remaining && cur >= 2 && cur < 0x0FFFFFF8) {
        for (uint32_t sec = 0; sec < fs.sectors_per_cluster; sec++) {
            uint64_t lba = cluster_to_lba(cur) + sec;
            uint32_t to_read = fs.bytes_per_sector;
            if (read_sectors(lba, 1, ptr)) { kfree(buffer); return NULL; }
            ptr += to_read;
            if (remaining <= to_read) { remaining = 0; break; }
            remaining -= to_read;
        }
        if (remaining)
            cur = fat_get_next(cur);
    }
    if (remaining) { kfree(buffer); return NULL; }
    return buffer;
}

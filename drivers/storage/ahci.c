#include "ahci.h"
#include <stdint.h>
#include <string.h>
#include "../../kernel/memory/alloc.h"
#include "../../kernel/memory/paging.h"
#include "../../kernel/debug.h"

/* Basic PCI config space access */
static inline uint32_t pci_read32(uint8_t bus, uint8_t slot,
                                  uint8_t func, uint8_t offset)
{
    uint32_t addr = (uint32_t)(1 << 31) |
                    ((uint32_t)bus << 16) |
                    ((uint32_t)slot << 11) |
                    ((uint32_t)func << 8) |
                    (offset & 0xfc);
    __asm__ volatile("outl %0, %1" :: "a"(addr), "d"((uint16_t)0xcf8));
    uint32_t data;
    __asm__ volatile("inl %1, %0" : "=a"(data) : "d"((uint16_t)0xcfc));
    return data;
}

/* AHCI structures taken from the AHCI specification */
typedef volatile struct {
    uint32_t clb;      // 0x00, command list base address
    uint32_t clbu;     // 0x04
    uint32_t fb;       // 0x08, FIS base address
    uint32_t fbu;      // 0x0C
    uint32_t is;       // 0x10, interrupt status
    uint32_t ie;       // 0x14, interrupt enable
    uint32_t cmd;      // 0x18
    uint32_t rsv0;     // 0x1C
    uint32_t tfd;      // 0x20, task file data
    uint32_t sig;      // 0x24
    uint32_t ssts;     // 0x28, SATA status (SCR0)
    uint32_t sctl;     // 0x2C, SATA control (SCR2)
    uint32_t serr;     // 0x30, SATA error (SCR1)
    uint32_t sact;     // 0x34, SATA active (SCR3)
    uint32_t ci;       // 0x38, command issue
    uint32_t sntf;     // 0x3C, SATA notification (SCR4)
    uint32_t fbs;      // 0x40
    uint32_t rsv1[11]; // 0x44 ~ 0x6F
    uint32_t vendor[4];// 0x70 ~ 0x7F
} hba_port_t;

typedef volatile struct {
    uint32_t cap;      // 0x00, Host capability
    uint32_t ghc;      // 0x04, Global host control
    uint32_t is;       // 0x08, Interrupt status
    uint32_t pi;       // 0x0C, Ports implemented
    uint32_t vs;       // 0x10, Version
    uint32_t ccc_ctl;  // 0x14
    uint32_t ccc_pts;  // 0x18
    uint32_t em_loc;   // 0x1C
    uint32_t em_ctl;   // 0x20
    uint32_t cap2;     // 0x24
    uint32_t bohc;     // 0x28
    uint8_t  rsv[0xA0-0x2C];
    uint8_t  vendor[0x100-0xA0];
    hba_port_t ports[32];
} hba_mem_t;

typedef struct {
    uint32_t dba;
    uint32_t dbau;
    uint32_t rsv0;
    uint32_t dbc_i; // bits 0-21 dbc, bit31 interrupt
} hba_prdt_entry_t;

typedef struct {
    uint8_t  cfis[64];
    uint8_t  acmd[16];
    uint8_t  rsv[48];
    hba_prdt_entry_t prdt[1];
} hba_cmd_tbl_t;

typedef struct {
    uint16_t flags;
    uint16_t prdtl;
    uint32_t prdbc;
    uint32_t ctba;
    uint32_t ctbau;
    uint32_t rsv1[4];
} hba_cmd_header_t;

static hba_port_t *boot_port = NULL;

static void start_port(hba_port_t *port)
{
    while (port->cmd & (1 << 15)) ; // wait CR (bit15) clear
    port->cmd &= ~(1 << 4); // FRE off
    port->cmd &= ~(1 << 0); // ST off
    while (port->cmd & ((1 << 14) | (1 << 15))) ;
    port->cmd |= (1 << 4); // FRE on
    port->cmd |= (1 << 0); // ST on
}

static int wait_for_clear(volatile uint32_t *reg, uint32_t mask, uint32_t timeout)
{
    while (timeout--) {
        if (!(*reg & mask))
            return 0;
    }
    return -1;
}

static int port_rw(hba_port_t *port, uint64_t lba, uint32_t count,
                   void *buf, int write)
{
    if (!port)
        return -1;

    hba_cmd_header_t *cl = (hba_cmd_header_t*)(uintptr_t)(port->clb);
    hba_cmd_tbl_t *tbl = (hba_cmd_tbl_t*)(((uintptr_t)cl) + sizeof(hba_cmd_header_t)*0);
    memset(tbl, 0, sizeof(hba_cmd_tbl_t));

    cl[0].flags = (5 << 0); // PRDT length 1, write=0
    if (write)
        cl[0].flags |= (1 << 6);
    cl[0].prdtl = 1;
    cl[0].ctba = (uint32_t)(uintptr_t)tbl;
    cl[0].ctbau = 0;

    tbl->prdt[0].dba = (uint32_t)(uintptr_t)buf;
    tbl->prdt[0].dbau = 0;
    tbl->prdt[0].dbc_i = ((count<<9)-1) | (1<<31);

    uint8_t *cfis = tbl->cfis;
    memset(cfis, 0, 64);
    cfis[0] = 0x27; // FIS type: Register Host to Device
    cfis[1] = (1<<7); // Command
    cfis[2] = write ? 0x35 : 0x25; // command
    cfis[7] = 1 << 6; // device
    cfis[4] = (uint8_t)(lba);
    cfis[5] = (uint8_t)(lba>>8);
    cfis[6] = (uint8_t)(lba>>16);
    cfis[8] = (uint8_t)(lba>>24);
    cfis[9] = (uint8_t)(lba>>32);
    cfis[10] = (uint8_t)(lba>>40);
    cfis[12] = (uint8_t)count;
    cfis[13] = (uint8_t)(count>>8);

    start_port(port);

    port->ci = 1;
    if (wait_for_clear(&port->ci, 1, 1000000))
        return -1;
    if (port->tfd & 0x88)
        return -1;
    return 0;
}

/* Detect first AHCI controller and prepare a single port */
void init_ahci(void)
{
    debug_puts("Scanning for AHCI controller\n");
    for (uint8_t bus = 0; bus < 256; bus++) {
        for (uint8_t slot = 0; slot < 32; slot++) {
            for (uint8_t func = 0; func < 8; func++) {
                uint32_t vendor_dev = pci_read32(bus, slot, func, 0);
                uint16_t vendor = vendor_dev & 0xFFFF;
                if (vendor == 0xFFFF)
                    continue;

                uint32_t classcode = pci_read32(bus, slot, func, 8);
                uint8_t subclass = (classcode >> 16) & 0xFF;
                uint8_t class = (classcode >> 24) & 0xFF;

                if (class == 0x01 && subclass == 0x06) {
                    uint16_t device = (vendor_dev >> 16) & 0xFFFF;
                    debug_puts("AHCI controller vendor 0x");
                    debug_puthex(vendor);
                    debug_puts(" device 0x");
                    debug_puthex(device);
                    debug_puts("\n");

                    uint32_t bar5 = pci_read32(bus, slot, func, 0x24);
                    uint64_t abar_phys = bar5 & ~0xF;
                    map_identity_range(abar_phys, sizeof(hba_mem_t));
                    hba_mem_t *abar = (hba_mem_t*)(uintptr_t)abar_phys;
                    uint32_t version = abar->vs;
                    uint32_t pi = abar->pi;

                    debug_puts("AHCI version 0x");
                    debug_puthex(version);
                    debug_puts(" ports 0x");
                    debug_puthex(pi);
                    debug_puts("\n");

                    for (int i = 0; i < 32; i++) {
                        if (pi & (1 << i)) {
                            hba_port_t *port = &abar->ports[i];
                            port->clb = (uint32_t)(uintptr_t)alloc_page();
                            port->fb  = (uint32_t)(uintptr_t)alloc_page();
                            memset((void*)(uintptr_t)port->clb, 0, 4096);
                            memset((void*)(uintptr_t)port->fb, 0, 4096);
                            boot_port = port;
                            return;
                        }
                    }
                }
            }
        }
    }
    debug_puts("No AHCI controller found\n");
}

int ahci_read(uint64_t lba, uint32_t count, void *buffer)
{
    if (!boot_port)
        return -1;
    return port_rw(boot_port, lba, count, buffer, 0);
}

int ahci_write(uint64_t lba, uint32_t count, const void *buffer)
{
    if (!boot_port)
        return -1;
    return port_rw(boot_port, lba, count, (void *)buffer, 1);
}

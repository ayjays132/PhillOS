#include "sim.h"
#include "../../kernel/debug.h"
#include "../driver_manager.h"
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <termios.h>
#include <errno.h>

static const char *modem_paths[] = {
    "/dev/ttyUSB0",
    "/dev/ttyACM0",
    "/dev/wwan0",
    NULL
};

static int modem_present = 0;
static char iccid_cache[32] = "";

static int sim_match(const pci_device_t *dev)
{
    return dev->class_code == 0x07 && dev->subclass == 0x03; // Communications Modem
}

static void sim_pnp_init(const pci_device_t *dev)
{
    (void)dev;
    init_sim();
}

static int open_modem(void)
{
    for (const char **p = modem_paths; *p; ++p) {
        int fd = open(*p, O_RDWR | O_NOCTTY | O_SYNC);
        if (fd >= 0)
            return fd;
    }
    return -1;
}

static const char *iccid_paths[] = {
    "/sys/class/mmc_host/mmc0/mmc0:0001/iccid",
    "/sys/class/net/wwan0/address",
    "/etc/iccid",
    NULL
};

void init_sim(void)
{
    debug_puts("Initializing SIM interface\n");
    int fd = open_modem();
    if (fd >= 0) {
        modem_present = 1;
        debug_puts("Modem detected\n");

        // try to read ICCID via AT command
        struct termios tio;
        if (tcgetattr(fd, &tio) == 0) {
            cfmakeraw(&tio);
            cfsetspeed(&tio, B115200);
            tcsetattr(fd, TCSANOW, &tio);
        }
        write(fd, "AT+CCID\r", 8);
        usleep(200000);
        char resp[64];
        int n = read(fd, resp, sizeof(resp) - 1);
        if (n > 0) {
            resp[n] = '\0';
            char *p = strstr(resp, "+CCID: ");
            if (p) {
                strncpy(iccid_cache, p + 7, sizeof(iccid_cache) - 1);
                iccid_cache[strcspn(iccid_cache, "\r\n")] = '\0';
            }
        }
        close(fd);
    } else {
        debug_puts("No modem detected\n");
    }
}

int sim_read_iccid(char *buf, int len)
{
    if (!modem_present || !buf || len <= 0)
        return -1;

    if (iccid_cache[0]) {
        strncpy(buf, iccid_cache, len - 1);
        buf[len - 1] = '\0';
        return 0;
    }

    for (const char **p = iccid_paths; *p; ++p) {
        FILE *f = fopen(*p, "r");
        if (!f)
            continue;
        if (fgets(buf, len, f)) {
            buf[strcspn(buf, "\n")] = '\0';
            fclose(f);
            return 0;
        }
        fclose(f);
    }
    debug_puts("ICCID read failed\n");
    return -1;
}

int sim_modem_present(void)
{
    return modem_present;
}

const char *sim_get_iccid(void)
{
    return iccid_cache[0] ? iccid_cache : NULL;
}

int sim_send_sms(const char *to, const char *msg)
{
    if (!modem_present || !to || !msg)
        return -1;

    int fd = open_modem();
    if (fd < 0)
        return -1;

    struct termios tio;
    if (tcgetattr(fd, &tio) == 0) {
        cfmakeraw(&tio);
        cfsetspeed(&tio, B115200);
        tcsetattr(fd, TCSANOW, &tio);
    }

    char tmp[64];
    write(fd, "AT\r", 3);
    usleep(50000);
    write(fd, "AT+CMGF=1\r", 9);
    usleep(50000);
    snprintf(tmp, sizeof(tmp), "AT+CMGS=\"%s\"\r", to);
    write(fd, tmp, strlen(tmp));
    usleep(50000);
    write(fd, msg, strlen(msg));
    char ctrlz = 26;
    write(fd, &ctrlz, 1);
    usleep(100000);
    close(fd);
    return 0;
}

driver_t sim_pnp_driver = {
    .name = "SIM/Modem",
    .match = sim_match,
    .init = sim_pnp_init,
};

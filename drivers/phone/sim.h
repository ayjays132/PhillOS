#ifndef PHILLOS_SIM_H
#define PHILLOS_SIM_H

void init_sim(void);
int sim_read_iccid(char *buf, int len);
int sim_modem_present(void);
const char *sim_get_iccid(void);
int sim_send_sms(const char *to, const char *msg);

#endif // PHILLOS_SIM_H

#ifndef PHILLOS_SYSCALL_DETECTOR_H
#define PHILLOS_SYSCALL_DETECTOR_H

void syscall_detector_init(void);
void syscall_record(int nr);
int syscall_predict_threat(void);

#endif // PHILLOS_SYSCALL_DETECTOR_H

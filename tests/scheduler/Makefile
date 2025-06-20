CC ?= gcc
CFLAGS ?= -include stddef.h -std=c11 -Wall -Wextra -I../../kernel/scheduler
TARGET = chaos_sched_test
SRC = chaos_sched_test.c ../../kernel/scheduler/chaos_sched.c

all: $(TARGET)

$(TARGET): $(SRC)
	$(CC) $(CFLAGS) -o $@ $(SRC)

clean:
	rm -f $(TARGET)

.PHONY: all clean

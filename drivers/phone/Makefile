CC ?= gcc
CFLAGS ?= -fPIC -O2 -Wall
LDFLAGS ?= -shared

OBJS = bluetooth.o sim.o
LIBS = -lbluetooth

libphone.so: $(OBJS)
	$(CC) $(LDFLAGS) -o $@ $(OBJS) $(LIBS)

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

all: libphone.so

clean:
	rm -f $(OBJS) libphone.so

.PHONY: all clean

CC ?= gcc
CFLAGS ?= -O2 -Wall
TARGET = query_tool
EXTRA = query_dev.o

all: $(TARGET) $(EXTRA)

$(TARGET): query_tool.c query.h
	$(CC) $(CFLAGS) -o $@ query_tool.c

$(EXTRA): ../drivers/query_dev.c ../kernel/query.h ../drivers/query_dev.h
	$(CC) $(CFLAGS) -c ../drivers/query_dev.c -o $(EXTRA)

clean:
	rm -f $(TARGET) $(EXTRA)

.PHONY: all clean

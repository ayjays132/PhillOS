CC ?= gcc
CFLAGS ?= -O2 -Wall
TARGET = query_tool

all: $(TARGET)

$(TARGET): query_tool.c query.h
	$(CC) $(CFLAGS) -o $@ query_tool.c

clean:
	rm -f $(TARGET)

.PHONY: all clean

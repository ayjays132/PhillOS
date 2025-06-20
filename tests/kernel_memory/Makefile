CC ?= gcc
CFLAGS ?= -include stddef.h  -std=c11 -Wall -Wextra -I../../kernel -I../../kernel/memory
TARGET = heap_test
SRC = heap_test.c ../../kernel/memory/heap.c ../../kernel/memory/alloc.c

all: $(TARGET)

$(TARGET): $(SRC)
	$(CC) $(CFLAGS) -o $@ $(SRC)

clean:
	rm -f $(TARGET)

.PHONY: all clean

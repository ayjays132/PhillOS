# Kernel Heap Allocator

This allocator provides simple dynamic memory for the kernel. It maintains a
singly linked list of blocks inside pages obtained from the physical page
allocator. Each block contains a small header recording its size, a pointer to
the next block and a flag indicating whether it is free.

When `kmalloc` is called, the list is scanned for a free block large enough for
the request. Blocks are split on demand. If no suitable block is found a new
4&nbsp;KiB page is requested from the physical allocator and added to the list.

`kfree` marks a block as free and attempts to merge it with adjacent free
blocks. Pages are not returned to the physical allocator once allocated which
keeps the implementation straightforward.

The heap is initialized by `init_heap` which grabs a single page to create the
first free block. Additional pages are pulled lazily when required.

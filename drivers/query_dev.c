#include "query_dev.h"
#include "../kernel/query.h"
#if defined(__linux__) && defined(__KERNEL__)
#include <linux/module.h>
#include <linux/miscdevice.h>
#include <linux/fs.h>
#include <linux/uaccess.h>
#endif

typedef struct {
    kernel_query_request_t req;
    kernel_query_response_t res;
    kernel_device_event_t event;
} query_ioc_t;

#ifndef QUERY_IOCTL
#define QUERY_IOCTL _IOWR('p', 1, query_ioc_t)
#endif

#if defined(__linux__) && defined(__KERNEL__)
static long query_ioctl(struct file *file, unsigned int cmd, unsigned long arg)
{
    if (cmd != QUERY_IOCTL)
        return -EINVAL;
    query_ioc_t ioc;
    if (copy_from_user(&ioc, (void __user *)arg, sizeof(ioc)))
        return -EFAULT;
    if (ioc.req.query == KERNEL_QUERY_NEXT_DEVICE_EVENT) {
        if (kernel_pop_device_event(&ioc.event) == 0)
            ioc.res.result = 1;
        else
            ioc.res.result = 0;
    } else if (kernel_query(&ioc.req, &ioc.res) != 0) {
        return -EINVAL;
    }
    if (copy_to_user((void __user *)arg, &ioc, sizeof(ioc)))
        return -EFAULT;
    return 0;
}

static const struct file_operations query_fops = {
    .owner = THIS_MODULE,
    .unlocked_ioctl = query_ioctl,
    .llseek = no_llseek,
};

static struct miscdevice query_miscdev = {
    .minor = MISC_DYNAMIC_MINOR,
    .name = "phillos-query",
    .fops = &query_fops,
};
#endif

int query_dev_register(void)
{
#if defined(__linux__) && defined(__KERNEL__)
    return misc_register(&query_miscdev);
#else
    return 0;
#endif
}

void query_dev_unregister(void)
{
#if defined(__linux__) && defined(__KERNEL__)
    misc_deregister(&query_miscdev);
#endif
}

#if defined(__linux__) && defined(__KERNEL__)
static int __init query_mod_init(void)
{
    return query_dev_register();
}
static void __exit query_mod_exit(void)
{
    query_dev_unregister();
}
module_init(query_mod_init);
module_exit(query_mod_exit);
MODULE_LICENSE("GPL");
#endif


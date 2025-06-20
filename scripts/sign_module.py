#!/usr/bin/env python3
import sys, subprocess, tempfile, os

def fnv1a64(data: bytes) -> bytes:
    h = 0xcbf29ce484222325
    for b in data:
        h ^= b
        h = (h * 0x100000001b3) & 0xffffffffffffffff
    return h.to_bytes(8, 'big')

if len(sys.argv) != 3:
    print("Usage: sign_module.py <private-key.pem> <module.ko>")
    sys.exit(1)

key, module = sys.argv[1], sys.argv[2]
with open(module, 'rb') as f:
    data = f.read()

digest = fnv1a64(data)
with tempfile.NamedTemporaryFile(delete=False) as tf:
    tf.write(digest)
    tf.flush()
    digest_file = tf.name
sig_file = tempfile.NamedTemporaryFile(delete=False)
sig_file.close()
subprocess.check_call([
    'openssl','pkeyutl','-sign','-inkey',key,
    '-pkeyopt','rsa_padding_mode:none','-rawin',
    '-in',digest_file,'-out',sig_file.name
])
with open(module, 'ab') as f, open(sig_file.name, 'rb') as sf:
    f.write(sf.read())
os.unlink(digest_file)
os.unlink(sig_file.name)

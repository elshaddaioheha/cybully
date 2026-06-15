import socket
import sys

print("=== STARTING NETWORK DIAGNOSTICS ===")
host = 'aws-1-eu-central-1.pooler.supabase.com'
port = 5432

print(f"Resolving {host}:{port} using standard socket.getaddrinfo...")
try:
    # Use the original getaddrinfo by accessing it (or just use standard socket call)
    # Note: socket.getaddrinfo might be patched, let's see if we can get the unpatched one
    # by importing it, or let's print both.
    # To check if it's patched:
    is_patched = "patched" in getattr(socket.getaddrinfo, "__name__", "")
    print(f"Is socket.getaddrinfo patched? {is_patched}")
    
    # Let's get the original one if patched
    orig_func = socket.getaddrinfo
    if is_patched:
        # Since we patched it, let's try to get the original or just run the current one.
        # But wait, in diagnostics.py we haven't imported app yet, so it won't be patched yet
        # unless it was imported. So it is the original one!
        pass
        
    res = socket.getaddrinfo(host, port)
    print("getaddrinfo results:")
    for r in res:
        print(f"  Family: {r[0]}, Type: {r[1]}, Proto: {r[2]}, Canonname: {r[3]}, Sockaddr: {r[4]}")
except Exception as e:
    print(f"getaddrinfo failed: {e}", file=sys.stderr)

print("Testing direct TCP connection to resolved IPs...")
try:
    res = socket.getaddrinfo(host, port)
    for r in res:
        family, type, proto, _, sockaddr = r
        ip = sockaddr[0]
        print(f"Attempting connection to {ip} on port {port} (family={family})...")
        try:
            s = socket.socket(family, socket.SOCK_STREAM)
            s.settimeout(5)
            s.connect((ip, port))
            print(f"  SUCCESS connect to {ip}:{port}")
            s.close()
        except Exception as conn_err:
            print(f"  FAILED connect to {ip}:{port} - Error: {conn_err}")
except Exception as e:
    print(f"Connection test failed: {e}")

print("=== END OF NETWORK DIAGNOSTICS ===")

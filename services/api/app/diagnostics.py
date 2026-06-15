import socket
import sys

print("=== STARTING NETWORK DIAGNOSTICS ===")

def resolve_and_print(host, family_name, family_val):
    print(f"Resolving {host} with family={family_name}...")
    try:
        res = socket.getaddrinfo(host, 5432, family=family_val)
        print(f"  Results for {family_name}:")
        for r in res:
            print(f"    Family: {r[0]}, Sockaddr: {r[4]}")
    except Exception as e:
        print(f"  Failed for {family_name}: {e}")

host = 'aws-1-eu-central-1.pooler.supabase.com'
resolve_and_print(host, "AF_UNSPEC (0)", socket.AF_UNSPEC)
resolve_and_print(host, "AF_INET (IPv4)", socket.AF_INET)
resolve_and_print(host, "AF_INET6 (IPv6)", socket.AF_INET6)

host2 = 'google.com'
resolve_and_print(host2, "AF_UNSPEC (0)", socket.AF_UNSPEC)
resolve_and_print(host2, "AF_INET (IPv4)", socket.AF_INET)

print("=== FORCE EXITING TO SHOW DIAGNOSTICS LOGS ===")
sys.exit(1)

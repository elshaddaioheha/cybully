import socket
import sys
import os
from urllib.parse import urlparse

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

# Check DATABASE_URL from environment
db_url = os.environ.get('DATABASE_URL', '')
print(f"DATABASE_URL env var exists: {bool(db_url)}")
if db_url:
    try:
        # Mask password in print
        parsed = urlparse(db_url)
        print(f"Parsed Host: {parsed.hostname}")
        print(f"Parsed Port: {parsed.port}")
        if parsed.hostname:
            resolve_and_print(parsed.hostname, "AF_UNSPEC (0)", socket.AF_UNSPEC)
            resolve_and_print(parsed.hostname, "AF_INET (IPv4)", socket.AF_INET)
    except Exception as e:
        print(f"Error parsing DATABASE_URL: {e}")

# Test pooler host
pooler_host = 'aws-1-eu-central-1.pooler.supabase.com'
resolve_and_print(pooler_host, "AF_UNSPEC (0)", socket.AF_UNSPEC)
resolve_and_print(pooler_host, "AF_INET (IPv4)", socket.AF_INET)

# Test direct host
direct_host = 'db.hmbnqzxfbxqvfexdeeyk.supabase.co'
resolve_and_print(direct_host, "AF_UNSPEC (0)", socket.AF_UNSPEC)
resolve_and_print(direct_host, "AF_INET (IPv4)", socket.AF_INET)

# Test google.com
resolve_and_print('google.com', "AF_UNSPEC (0)", socket.AF_UNSPEC)

print("=== FORCE EXITING TO SHOW DIAGNOSTICS LOGS ===")
sys.exit(1)

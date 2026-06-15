import socket
import sys
import os
from urllib.parse import urlparse

summary = []

def resolve_and_record(host):
    summary.append(f"Host: {host}")
    # AF_UNSPEC
    try:
        res = socket.getaddrinfo(host, 5432, family=socket.AF_UNSPEC)
        fams = [r[0] for r in res]
        # socket.AF_INET might be 2, socket.AF_INET6 might be 10 or 30
        has_v4 = any(f == socket.AF_INET for f in fams)
        has_v6 = any(f == socket.AF_INET6 for f in fams)
        summary.append(f"  UNSPEC: len={len(res)}, has_v4={has_v4}, has_v6={has_v6}")
        if res:
            summary.append(f"  First UNSPEC: family={res[0][0]}, ip={res[0][4][0]}")
    except Exception as e:
        summary.append(f"  UNSPEC failed: {type(e).__name__}: {e}")
        
    # AF_INET
    try:
        res = socket.getaddrinfo(host, 5432, family=socket.AF_INET)
        summary.append(f"  AF_INET: len={len(res)}, ip={res[0][4][0]}")
    except Exception as e:
        summary.append(f"  AF_INET failed: {type(e).__name__}: {e}")

# Check DATABASE_URL from environment
db_url = os.environ.get('DATABASE_URL', '')
summary.append(f"DB_URL exists: {bool(db_url)}")
if db_url:
    try:
        parsed = urlparse(db_url)
        summary.append(f"Parsed Host: {parsed.hostname}")
        if parsed.hostname:
            resolve_and_record(parsed.hostname)
    except Exception as e:
        summary.append(f"Parse error: {e}")

resolve_and_record('aws-1-eu-central-1.pooler.supabase.com')
resolve_and_record('db.hmbnqzxfbxqvfexdeeyk.supabase.co')
resolve_and_record('google.com')

print("=== DIAGNOSTICS SUMMARY ===")
print("\n".join(summary))
print("=== END DIAGNOSTICS SUMMARY ===")
sys.exit(1)

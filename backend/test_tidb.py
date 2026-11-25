import os
import ssl
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

ca_rel = os.getenv("CA_PATH", "certs/tidb-ca.pem")
ca_path = BASE_DIR / ca_rel

print("Checking TiDB configuration...")
print(f"Host: {os.getenv('TIDB_HOST')}")
print(f"Port: {os.getenv('TIDB_PORT')}")
print(f"Database: {os.getenv('TIDB_DB_NAME')}")
print(f"CA exists: {ca_path.exists()} ({ca_path})")

if not ca_path.exists():
    print("ERROR: CA certificate not found.")
    raise SystemExit(1)

# Method 1: Using pymysql with ssl.SSLContext (validates TLS certificate and hostname)
try:
    import pymysql
    print("\n--- Connecting to TiDB using PyMySQL + SSLContext (VERIFY_IDENTITY) ---")
    ssl_ctx = ssl.create_default_context(cafile=str(ca_path))
    ssl_ctx.check_hostname = True
    ssl_ctx.verify_mode = ssl.CERT_REQUIRED

    conn = pymysql.connect(
        host=os.getenv("TIDB_HOST"),
        port=int(os.getenv("TIDB_PORT", "4000")),
        user=os.getenv("TIDB_USER"),
        password=os.getenv("TIDB_PASSWORD"),
        database=os.getenv("TIDB_DB_NAME"),
        ssl=ssl_ctx,
        connect_timeout=15,
    )
    cursor = conn.cursor()
    cursor.execute("SELECT VERSION()")
    version = cursor.fetchone()
    print("SUCCESS: Connected to TiDB!")
    print("TiDB Version:", version[0])

    cursor.execute("SHOW STATUS LIKE 'Ssl_cipher'")
    ssl_status = cursor.fetchone()
    print("TLS Cipher:", ssl_status[1] if ssl_status else "Unknown")

    cursor.close()
    conn.close()
    print("Connection closed successfully.")
except Exception as e:
    print(f"PyMySQL connection failed: {type(e).__name__}: {e}")

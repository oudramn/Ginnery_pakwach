"""The Ginnery booking request server: standard-library HTTP + SQLite.

Stores guest enquiries for hotel review. Availability, pricing, payments, messaging and PMS synchronization require separate hotel systems and approved configuration.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import time
import base64
import threading
import ipaddress
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit


def load_secret_file() -> None:
    secret_path = os.environ.get("GINNERY_SECRETS_FILE")
    if not secret_path:
        return
    values = json.loads(Path(secret_path).read_text(encoding="utf-8"))
    if not isinstance(values, dict):
        raise RuntimeError("GINNERY_SECRETS_FILE must contain a JSON object.")
    for key in ("GINNERY_SECRET_KEY", "GINNERY_ADMIN_USER", "GINNERY_ADMIN_PASSWORD", "GINNERY_ADMIN_EMAIL"):
        value = values.get(key)
        if isinstance(value, str) and value:
            os.environ[key] = value


load_secret_file()
ROOT = Path(__file__).resolve().parent
INSTANCE = Path(os.environ.get("GINNERY_DATA_DIR", str(ROOT / "instance"))).expanduser()
INSTANCE.mkdir(exist_ok=True)
UPLOADS = INSTANCE / "uploads"
UPLOADS.mkdir(exist_ok=True)
BACKUPS = INSTANCE / "backups"
BACKUPS.mkdir(exist_ok=True)
DB_PATH = Path(os.environ.get("GINNERY_DATABASE", str(INSTANCE / "ginnery.sqlite3")))
DB_PATH.parent.mkdir(parents=True, exist_ok=True)
HOST = os.environ.get("GINNERY_HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "8000"))
ADMIN_USER = os.environ.get("GINNERY_ADMIN_USER", "admin")
ADMIN_PASSWORD = os.environ.get("GINNERY_ADMIN_PASSWORD", "")
ADMIN_EMAIL = os.environ.get("GINNERY_ADMIN_EMAIL", "admin@localhost")
SECRET = (os.environ.get("GINNERY_SECRET_KEY") or secrets.token_hex(32)).encode("utf-8")
SECRET_CONFIGURED = bool(os.environ.get("GINNERY_SECRET_KEY"))
PRODUCTION = os.environ.get("GINNERY_ENV", "development").strip().lower() == "production"
AWS_REGION = os.environ.get("AWS_REGION", "")
BACKUP_BUCKET = os.environ.get("GINNERY_BACKUP_S3_BUCKET", "")
BACKUP_KMS_KEY = os.environ.get("GINNERY_BACKUP_KMS_KEY", "")
BACKUP_PREFIX = os.environ.get("GINNERY_BACKUP_S3_PREFIX", "ginnery/production").strip("/")
BACKUP_RETENTION_DAYS = 30
ANALYTICS_RETENTION_DAYS = 365
BACKUP_LOCK = threading.RLock()
COOKIE_NAME = "ginnery_admin"
COOKIE_TTL = 8 * 60 * 60
VALID_SERVICES = {"stay", "dining", "bar", "events", "spa", "paddle", "mini_golf"}
VALID_STATUSES = {"New request", "Contacted", "Confirmed", "Cancelled"}
APPROVED_PHOTO_FILES = {
    "approved-restaurant-mural.jpg",
    "approved-luxury-room-bed.jpg",
    "approved-safari-tents.jpg",
    "approved-garden-walkway.jpg",
    "approved-bale-house-bunks.jpg",
    "approved-pool-terrace.jpg",
    "approved-spa-room.jpg",
    "approved-mini-golf.jpg",
    "approved-padel-cafe.jpg",
    "approved-fig-tree-drive.jpg",
    "approved-dusk-tree-pool.jpg",
 }
ALLOWED_FILES = {
    "index.html", "explore.html", "explore.css", "explore.js", "booking.html", "booking-extras.js", "admin.html", "admin-extras.js", "site-analytics.js", "site-i18n.js", "premium-buttons.css", "motion-frames.html",
    "ginnery-polish.css", "fx.css", "fx.js", "ginnery-logo.png", "ginnery-favicon.png"
} | APPROVED_PHOTO_FILES
PRODUCTION_FILES = {"index.html", "explore.html", "explore.css", "explore.js", "booking.html", "booking-extras.js", "admin.html", "admin-extras.js", "site-analytics.js", "site-i18n.js", "premium-buttons.css", "ginnery-polish.css", "fx.css", "fx.js", "ginnery-logo.png", "ginnery-favicon.png"} | APPROVED_PHOTO_FILES

CONTENT_SCHEMAS = {
    "rooms": ({"name": 100, "category": 60, "description": 500, "price": 80, "priceLabel": 80, "image": 500, "bookingService": 20}, ("name",)),
    "menuItems": ({"category": 60, "name": 100, "description": 400, "price": 80, "image": 500, "dietaryTags": 180}, ("category", "name")),
    "events": ({"title": 120, "category": 60, "description": 500, "date": 80, "image": 500, "link": 500}, ("title", "description")),
    "gallery": ({"image": 500, "caption": 180, "alt": 180}, ("image",)),
    "team": ({"name": 100, "role": 80, "bio": 500, "image": 500}, ("name", "role")),
    "activities": ({"name": 100, "category": 80, "description": 500, "image": 500, "reservationService": 24}, ("name", "category", "description")),
    "faqs": ({"question": 180, "answer": 1200, "category": 80}, ("question", "answer")),
}
CONTENT_LIMITS = {"rooms": 20, "menuItems": 100, "events": 40, "gallery": 40, "team": 30, "activities": 20, "faqs": 60}
FEED_CATEGORIES = {"Hotel journal", "Rooms & suites", "At the table", "Events", "People & place", "Seasonal moments"}


def safe_media_url(value: object) -> bool:
    text = str(value or "").strip()
    if re.fullmatch(r"/uploads/[a-f0-9]{32}\.(jpg|png|webp)", text):
        return True
    if text.startswith("/") and text[1:] in APPROVED_PHOTO_FILES:
        return True
    try:
        parsed = urlsplit(text)
        return parsed.scheme == "https" and bool(parsed.hostname) and not parsed.username and not parsed.password and not any(ch.isspace() for ch in text)
    except ValueError:
        return False


def clean_post(source: object) -> dict:
    if not isinstance(source, dict):
        raise ValueError("Feed story must be an object.")
    title = str(source.get("title", "")).strip()[:120]
    caption = str(source.get("caption", "")).strip()[:600]
    image = str(source.get("image", "")).strip()[:500]
    category = str(source.get("category", "Hotel journal")).strip()
    post_id = str(source.get("id") or "").strip()
    if not title or not caption or not image or not safe_media_url(image):
        raise ValueError("Each feed story needs a title, caption and secure photo URL or uploaded hotel image.")
    if category not in FEED_CATEGORIES:
        category = "Hotel journal"
    if not re.fullmatch(r"[a-zA-Z0-9_-]{1,40}", post_id):
        post_id = "post-" + secrets.token_hex(8)
    return {"id": post_id, "title": title, "category": category, "caption": caption, "image": image,
            "createdAt": str(source.get("createdAt") or utc_now())[:40]}


def clean_collection(name: str, source: object) -> list[dict]:
    if not isinstance(source, list) or len(source) > CONTENT_LIMITS[name]:
        raise ValueError(f"{name} supports up to {CONTENT_LIMITS[name]} entries.")
    fields, required = CONTENT_SCHEMAS[name]
    result = []
    for item in source:
        if not isinstance(item, dict):
            raise ValueError(f"Each {name} entry must be an object.")
        clean = {key: str(item.get(key, "")).strip()[:limit] for key, limit in fields.items()}
        if any(not clean[key] for key in required):
            raise ValueError(f"Complete the required fields for every {name} entry.")
        if clean.get("image") and not safe_media_url(clean["image"]):
            raise ValueError("Images must use HTTPS or an uploaded hotel image.")
        if name == "activities" and clean["reservationService"] not in {"", "spa", "paddle", "mini_golf"}:
            raise ValueError("Activities can link to spa, paddle court or mini golf enquiries.")
        if name == "rooms" and clean["bookingService"] not in {"", "stay"}:
            clean["bookingService"] = "stay"
        clean["id"] = str(item.get("id") or "")[:40]
        if not re.fullmatch(r"[a-zA-Z0-9_-]{1,40}", clean["id"]):
            clean["id"] = name.rstrip("s") + "-" + secrets.token_hex(6)
        result.append(clean)
    return result


def db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON")
    conn.execute("PRAGMA busy_timeout=10000")
    return conn


def secure_cookies() -> bool:
    return os.environ.get("GINNERY_COOKIE_SECURE", "0") == "1"


def session_cookie(value: str, max_age: int = COOKIE_TTL) -> str:
    cookie = f"{COOKIE_NAME}={value}; Path=/; Max-Age={max_age}; HttpOnly; SameSite=Strict"
    return cookie + ("; Secure" if secure_cookies() else "")


def validate_runtime() -> None:
    if PRODUCTION:
        requirements = []
        if not SECRET_CONFIGURED or len(SECRET) < 32:
            requirements.append("GINNERY_SECRET_KEY of at least 32 characters")
        if HOST in {"127.0.0.1", "localhost", "::1"}:
            if os.environ.get("GINNERY_TRUSTED_PROXY") != "1":
                requirements.append("GINNERY_TRUSTED_PROXY=1 when binding to loopback behind HTTPS")
        elif os.environ.get("GINNERY_ALLOW_REMOTE") != "1":
            requirements.append("GINNERY_ALLOW_REMOTE=1 behind HTTPS")
        if not secure_cookies():
            requirements.append("GINNERY_COOKIE_SECURE=1")
        if not os.environ.get("GINNERY_DATA_DIR") or not os.environ.get("GINNERY_DATABASE"):
            requirements.append("persistent GINNERY_DATA_DIR and GINNERY_DATABASE paths")
        if not AWS_REGION or not BACKUP_BUCKET or not BACKUP_KMS_KEY:
            requirements.append("AWS_REGION, GINNERY_BACKUP_S3_BUCKET and GINNERY_BACKUP_KMS_KEY")
        if not re.fullmatch(r"[A-Za-z0-9/_-]{1,180}", BACKUP_PREFIX):
            requirements.append("a safe GINNERY_BACKUP_S3_PREFIX")
        if ADMIN_USER.strip().lower() in {"", "admin"}:
            requirements.append("a non-default GINNERY_ADMIN_USER")
        if len(ADMIN_PASSWORD) < 16:
            requirements.append("a unique GINNERY_ADMIN_PASSWORD of at least 16 characters")
        if "@" not in ADMIN_EMAIL or ADMIN_EMAIL.endswith(".test"):
            requirements.append("a real GINNERY_ADMIN_EMAIL")
        if requirements:
            raise SystemExit("Production startup blocked; configure: " + "; ".join(requirements) + ".")
    elif HOST not in {"127.0.0.1", "localhost", "::1"} and not (
        os.environ.get("GINNERY_ALLOW_REMOTE") == "1" and SECRET_CONFIGURED and secure_cookies()
    ):
        raise SystemExit("Refusing remote binding: set GINNERY_ALLOW_REMOTE=1, GINNERY_SECRET_KEY and GINNERY_COOKIE_SECURE=1 behind reviewed HTTPS hosting.")


def initialise_db() -> None:
    with db() as conn:
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute(
            """CREATE TABLE IF NOT EXISTS reservations (
                reference TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                updated_at TEXT,
                service TEXT NOT NULL,
                guest_name TEXT NOT NULL,
                guest_email TEXT NOT NULL,
                guest_phone TEXT NOT NULL,
                date_summary TEXT,
                guest_count TEXT,
                currency TEXT NOT NULL DEFAULT 'UGX',
                status TEXT NOT NULL DEFAULT 'New request',
                payment_status TEXT NOT NULL DEFAULT 'Not collected',
                amount_due_minor INTEGER NOT NULL DEFAULT 0,
                amount_paid_minor INTEGER NOT NULL DEFAULT 0,
                analytics_visitor_hash TEXT,
                contacted_at TEXT,
                contacted_by TEXT,
                contact_method TEXT,
                contact_note TEXT,
                transfer_requested INTEGER NOT NULL DEFAULT 0,
                marketing_consent INTEGER NOT NULL DEFAULT 0,
                marketing_consent_at TEXT,
                payload_json TEXT NOT NULL,
                details_json TEXT NOT NULL DEFAULT '{}'
            )"""
        )
        reservation_columns = {row["name"] for row in conn.execute("PRAGMA table_info(reservations)").fetchall()}
        for name, declaration in {
            "amount_due_minor": "INTEGER NOT NULL DEFAULT 0",
            "amount_paid_minor": "INTEGER NOT NULL DEFAULT 0",
            "analytics_visitor_hash": "TEXT",
            "contacted_at": "TEXT",
            "contacted_by": "TEXT",
            "contact_method": "TEXT",
            "contact_note": "TEXT",
            "marketing_consent": "INTEGER NOT NULL DEFAULT 0",
            "marketing_consent_at": "TEXT",
        }.items():
            if name not in reservation_columns:
                conn.execute(f"ALTER TABLE reservations ADD COLUMN {name} {declaration}")
        conn.execute(
            """CREATE TABLE IF NOT EXISTS marketing_suppressions (
                email TEXT PRIMARY KEY,
                suppressed_at TEXT NOT NULL,
                suppressed_by TEXT NOT NULL
            )"""
        )
        conn.execute(
            """UPDATE reservations SET status=CASE status
                WHEN 'New request (demo)' THEN 'New request'
                WHEN 'Contacted (demo)' THEN 'Contacted'
                WHEN 'Confirmed (demo only)' THEN 'Confirmed'
                WHEN 'Cancelled (demo only)' THEN 'Cancelled'
                ELSE status END
            WHERE status IN ('New request (demo)','Contacted (demo)','Confirmed (demo only)','Cancelled (demo only)')"""
        )
        conn.execute("""CREATE TABLE IF NOT EXISTS staff_users (
            username TEXT PRIMARY KEY, display_name TEXT NOT NULL, email TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('admin','manager','website_manager','staff')),
            password_hash TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL, updated_at TEXT,
            auth_epoch INTEGER NOT NULL DEFAULT 0
        )""")
        user_columns = {row["name"] for row in conn.execute("PRAGMA table_info(staff_users)").fetchall()}
        if "auth_epoch" not in user_columns:
            conn.execute("ALTER TABLE staff_users ADD COLUMN auth_epoch INTEGER NOT NULL DEFAULT 0")
        user_schema = conn.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='staff_users'").fetchone()
        if user_schema and "website_manager" not in (user_schema["sql"] or ""):
            conn.execute("ALTER TABLE staff_users RENAME TO staff_users_legacy")
            conn.execute("""CREATE TABLE staff_users (
                username TEXT PRIMARY KEY, display_name TEXT NOT NULL, email TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('admin','manager','website_manager','staff')),
                password_hash TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL, updated_at TEXT,
                auth_epoch INTEGER NOT NULL DEFAULT 0
            )""")
            conn.execute("""INSERT INTO staff_users(username,display_name,email,role,password_hash,active,created_at,updated_at,auth_epoch)
                SELECT username,display_name,email,role,password_hash,active,created_at,updated_at,auth_epoch FROM staff_users_legacy""")
            conn.execute("DROP TABLE staff_users_legacy")
        user_columns = {row["name"] for row in conn.execute("PRAGMA table_info(staff_users)").fetchall()}
        if "auth_epoch" not in user_columns:
            conn.execute("ALTER TABLE staff_users ADD COLUMN auth_epoch INTEGER NOT NULL DEFAULT 0")
        conn.execute("CREATE TABLE IF NOT EXISTS site_content (id INTEGER PRIMARY KEY CHECK(id=1), draft_json TEXT NOT NULL DEFAULT '{}', published_json TEXT NOT NULL DEFAULT '{}', updated_at TEXT)")
        conn.execute("""CREATE TABLE IF NOT EXISTS payment_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reservation_reference TEXT NOT NULL REFERENCES reservations(reference) ON DELETE CASCADE,
            amount_minor INTEGER NOT NULL CHECK(amount_minor > 0), currency TEXT NOT NULL,
            method TEXT NOT NULL, external_reference TEXT NOT NULL DEFAULT '', note TEXT NOT NULL DEFAULT '',
            received_at TEXT NOT NULL, received_by TEXT NOT NULL
        )""")
        conn.execute("""CREATE TABLE IF NOT EXISTS contact_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reservation_reference TEXT NOT NULL REFERENCES reservations(reference) ON DELETE CASCADE,
            contacted_at TEXT NOT NULL, contacted_by TEXT NOT NULL,
            method TEXT NOT NULL, note TEXT NOT NULL DEFAULT ''
        )""")
        conn.execute("CREATE TABLE IF NOT EXISTS offers (id TEXT PRIMARY KEY, name TEXT NOT NULL, audience TEXT NOT NULL, start_date TEXT, end_date TEXT, details TEXT, created_at TEXT NOT NULL, published INTEGER NOT NULL DEFAULT 0, promo_code TEXT NOT NULL DEFAULT '', service TEXT NOT NULL DEFAULT 'stay')")
        offer_columns = {row["name"] for row in conn.execute("PRAGMA table_info(offers)").fetchall()}
        if "published" not in offer_columns:
            conn.execute("ALTER TABLE offers ADD COLUMN published INTEGER NOT NULL DEFAULT 0")
        if "promo_code" not in offer_columns:
            conn.execute("ALTER TABLE offers ADD COLUMN promo_code TEXT NOT NULL DEFAULT ''")
        if "service" not in offer_columns:
            conn.execute("ALTER TABLE offers ADD COLUMN service TEXT NOT NULL DEFAULT 'stay'")
        conn.execute("CREATE TABLE IF NOT EXISTS audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL, actor TEXT NOT NULL, action TEXT NOT NULL, target TEXT NOT NULL DEFAULT '', detail TEXT NOT NULL DEFAULT '')")
        conn.execute("CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL)")
        conn.execute("""CREATE TABLE IF NOT EXISTS site_analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL,
            event_type TEXT NOT NULL CHECK(event_type IN ('page_view','post_view')),
            visitor_hash TEXT NOT NULL,
            page_path TEXT NOT NULL,
            post_id TEXT NOT NULL DEFAULT ''
        )""")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_site_analytics_created_event ON site_analytics(created_at,event_type)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_site_analytics_post ON site_analytics(post_id,created_at)")
        conn.execute("""CREATE TABLE IF NOT EXISTS cookie_consents (
            consent_hash TEXT PRIMARY KEY,
            analytics_enabled INTEGER NOT NULL CHECK(analytics_enabled IN (0,1)),
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )""")
        admin = conn.execute("SELECT username FROM staff_users WHERE role='admin' LIMIT 1").fetchone()
        if not admin:
            initial_password = ADMIN_PASSWORD or secrets.token_urlsafe(24)
            initial_email = ADMIN_EMAIL
            if not ADMIN_PASSWORD:
                credential_file = INSTANCE / "initial-admin-credentials.txt"
                credential_file.write_text(f"Username: {ADMIN_USER}\nEmail: {initial_email}\nTemporary password: {initial_password}\nChange this password after your first sign-in.\n", encoding="utf-8")
                try:
                    credential_file.chmod(0o600)
                except OSError:
                    pass
                print(f"A one-time administrator password was saved to {credential_file}")
            conn.execute("INSERT INTO staff_users(username,display_name,email,role,password_hash,active,created_at) VALUES(?,?,?,?,?,1,?)",
                         (ADMIN_USER, "Hotel Administrator", initial_email, "admin", password_hash(initial_password), utc_now()))
        conn.execute("INSERT OR IGNORE INTO app_settings(key,value,updated_at) VALUES('retention_days','0',?)", (utc_now(),))
        conn.execute("INSERT OR IGNORE INTO app_settings(key,value,updated_at) VALUES('audit_retention_days','0',?)", (utc_now(),))
        conn.execute("UPDATE reservations SET contacted_at=COALESCE(updated_at,created_at),contacted_by=COALESCE(contacted_by,'legacy'),contact_method=COALESCE(contact_method,'other'),contact_note=COALESCE(contact_note,'Previously marked as contacted') WHERE status='Contacted' AND contacted_at IS NULL")
        legacy_columns = {row["name"] for row in conn.execute("PRAGMA table_info(reservations)").fetchall()}
        if {"sale_amount", "sale_currency", "paid_at"}.issubset(legacy_columns):
            for old in conn.execute("SELECT reference,currency,sale_amount,sale_currency,paid_at,amount_due_minor,amount_paid_minor FROM reservations").fetchall():
                currency = old["sale_currency"] or old["currency"] or "UGX"
                due = parse_money_minor(old["sale_amount"], currency)
                if due and int(old["amount_due_minor"] or 0) == 0:
                    conn.execute("UPDATE reservations SET amount_due_minor=? WHERE reference=?", (due, old["reference"]))
                if due and old["paid_at"] and int(old["amount_paid_minor"] or 0) == 0:
                    exists = conn.execute("SELECT 1 FROM payment_entries WHERE reservation_reference=? AND method='legacy_record' LIMIT 1", (old["reference"],)).fetchone()
                    if not exists:
                        conn.execute("INSERT INTO payment_entries(reservation_reference,amount_minor,currency,method,external_reference,note,received_at,received_by) VALUES(?,?,?,?,?,?,?,?)", (old["reference"], due, currency, "legacy_record", "", "Payment migrated from the previous payment confirmation record.", str(old["paid_at"]), "legacy"))
                        conn.execute("UPDATE reservations SET amount_paid_minor=?,payment_status='Paid' WHERE reference=?", (due, old["reference"]))


def audit(actor: str, action: str, target: str = "", detail: str = "") -> None:
    with db() as conn:
        conn.execute("INSERT INTO audit_log(created_at,actor,action,target,detail) VALUES(?,?,?,?,?)",
                     (utc_now(), actor[:80], action[:80], target[:120], detail[:300]))


def retention_days() -> int:
    with db() as conn:
        row = conn.execute("SELECT value FROM app_settings WHERE key='retention_days'").fetchone()
    try:
        return max(0, min(3650, int(row["value"]))) if row else 0
    except (ValueError, TypeError):
        return 0


def audit_retention_days() -> int:
    with db() as conn:
        row = conn.execute("SELECT value FROM app_settings WHERE key='audit_retention_days'").fetchone()
    try:
        return max(0, min(3650, int(row["value"]))) if row else 0
    except (ValueError, TypeError):
        return 0


def create_backup() -> Path:
    with BACKUP_LOCK:
        return _create_backup_locked()


def _create_backup_locked() -> Path:
    from datetime import datetime, timezone
    import zipfile
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    target = BACKUPS / ("ginnery-" + stamp + ".zip")
    db_snapshot = BACKUPS / (".snapshot-" + stamp + ".sqlite3")
    source = sqlite3.connect(DB_PATH, timeout=10)
    destination = sqlite3.connect(db_snapshot)
    try:
        source.backup(destination)
    finally:
        destination.close(); source.close()
    temp_archive = target.with_suffix(".zip.tmp")
    try:
        with zipfile.ZipFile(temp_archive, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            archive.write(db_snapshot, "ginnery.sqlite3")
            for asset in UPLOADS.rglob("*"):
                if asset.is_file():
                    archive.write(asset, "uploads/" + asset.relative_to(UPLOADS).as_posix())
        os.replace(temp_archive, target)
        if BACKUP_BUCKET:
            try:
                upload_remote_backup(target)
            except Exception:
                target.unlink(missing_ok=True)
                raise
    finally:
        db_snapshot.unlink(missing_ok=True)
        temp_archive.unlink(missing_ok=True)
    return target


def s3_client():
    if not BACKUP_BUCKET or not BACKUP_KMS_KEY or not AWS_REGION:
        raise RuntimeError("AWS encrypted backup storage is not configured.")
    try:
        import boto3
    except ImportError as exc:
        raise RuntimeError("Install the AWS SDK dependency to use off-site backups.") from exc
    return boto3.client("s3", region_name=AWS_REGION)


def remote_backup_key(path: Path) -> str:
    return f"{BACKUP_PREFIX}/{path.name}"


def upload_remote_backup(path: Path) -> None:
    s3_client().upload_file(
        str(path), BACKUP_BUCKET, remote_backup_key(path),
        ExtraArgs={"ServerSideEncryption": "aws:kms", "SSEKMSKeyId": BACKUP_KMS_KEY, "BucketKeyEnabled": True},
    )


def delete_remote_backups() -> int:
    if not BACKUP_BUCKET:
        return 0
    client = s3_client()
    paginator = client.get_paginator("list_object_versions")
    objects = []
    for page in paginator.paginate(Bucket=BACKUP_BUCKET, Prefix=BACKUP_PREFIX + "/"):
        objects.extend({"Key": item["Key"], "VersionId": item["VersionId"]}
                       for item in page.get("Versions", []) + page.get("DeleteMarkers", [])
                       if re.fullmatch(r"ginnery-[0-9TZ]+\.zip", item.get("Key", "").rsplit("/", 1)[-1]))
    removed = 0
    for offset in range(0, len(objects), 1000):
        batch = objects[offset:offset + 1000]
        response = client.delete_objects(Bucket=BACKUP_BUCKET, Delete={"Objects": batch, "Quiet": True})
        if response.get("Errors"):
            raise RuntimeError("Some off-site backup versions could not be deleted.")
        removed += len(batch)
    return removed


def count_remote_backups() -> int:
    if not BACKUP_BUCKET:
        return 0
    client = s3_client()
    paginator = client.get_paginator("list_object_versions")
    count = 0
    for page in paginator.paginate(Bucket=BACKUP_BUCKET, Prefix=BACKUP_PREFIX + "/"):
        count += sum(1 for item in page.get("Versions", []) + page.get("DeleteMarkers", [])
                     if re.fullmatch(r"ginnery-[0-9TZ]+\.zip", item.get("Key", "").rsplit("/", 1)[-1]))
    return count


def clear_backup_copies() -> dict:
    with BACKUP_LOCK:
        remote_removed = delete_remote_backups()
        local_removed = 0
        # The backup directory is dedicated to archives and their temporary
        # snapshots, so clear interrupted/in-progress artifacts too.
        backup_artifacts = list(BACKUPS.glob("ginnery-*.zip"))
        backup_artifacts.extend(BACKUPS.glob(".snapshot-*.sqlite3"))
        backup_artifacts.extend(BACKUPS.glob("ginnery-*.zip.tmp"))
        for path in backup_artifacts:
            try:
                path.unlink()
                local_removed += 1
            except FileNotFoundError:
                continue
        return {"localBackupsRemoved": local_removed, "remoteBackupsRemoved": remote_removed}


def retention_has_expired_records() -> bool:
    from datetime import datetime, timedelta, timezone
    now = datetime.now(timezone.utc)
    checks = []
    request_days = retention_days()
    if request_days:
        checks.append(("reservations", (now - timedelta(days=request_days)).isoformat()))
    audit_days = audit_retention_days()
    if audit_days:
        checks.append(("audit_log", (now - timedelta(days=audit_days)).isoformat()))
    with db() as conn:
        return any(conn.execute(f"SELECT 1 FROM {table} WHERE created_at < ? LIMIT 1", (cutoff,)).fetchone() for table, cutoff in checks)


def apply_retention() -> int:
    days = retention_days()
    if not days:
        return 0
    from datetime import datetime, timedelta, timezone
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    with db() as conn:
        cur = conn.execute("DELETE FROM reservations WHERE created_at < ?", (cutoff,))
        return cur.rowcount


def apply_audit_retention() -> int:
    days = audit_retention_days()
    if not days:
        return 0
    from datetime import datetime, timedelta, timezone
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    with db() as conn:
        cur = conn.execute("DELETE FROM audit_log WHERE created_at < ?", (cutoff,))
        return cur.rowcount


def expired_audit_events_count() -> int:
    days = audit_retention_days()
    if not days:
        return 0
    from datetime import datetime, timedelta, timezone
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    with db() as conn:
        return int(conn.execute("SELECT COUNT(*) FROM audit_log WHERE created_at < ?", (cutoff,)).fetchone()[0])


def stale_local_backups(now=None) -> list[Path]:
    from datetime import datetime, timedelta, timezone
    now = now or datetime.now(timezone.utc)
    cutoff = now - timedelta(days=BACKUP_RETENTION_DAYS)
    return [path for path in BACKUPS.glob("ginnery-*.zip")
            if datetime.fromtimestamp(path.stat().st_mtime, timezone.utc) < cutoff]


def stale_remote_backups(cutoff) -> list[dict]:
    if not (BACKUP_BUCKET and BACKUP_KMS_KEY and AWS_REGION):
        return []
    client = s3_client()
    paginator = client.get_paginator("list_object_versions")
    stale = []
    for page in paginator.paginate(Bucket=BACKUP_BUCKET, Prefix=BACKUP_PREFIX + "/"):
        for key in ("Versions", "DeleteMarkers"):
            for item in page.get(key, []):
                name = item.get("Key", "").rsplit("/", 1)[-1]
                if (re.fullmatch(r"ginnery-[0-9TZ]+\.zip", name)
                        and item.get("LastModified") and item["LastModified"] < cutoff):
                    stale.append({"Key": item["Key"], "VersionId": item["VersionId"]})
    return stale


def delete_stale_remote_backups(cutoff) -> int:
    if not (BACKUP_BUCKET and BACKUP_KMS_KEY and AWS_REGION):
        return 0
    client = s3_client()
    stale = stale_remote_backups(cutoff)
    removed = 0
    for offset in range(0, len(stale), 1000):
        batch = stale[offset:offset + 1000]
        response = client.delete_objects(Bucket=BACKUP_BUCKET, Delete={"Objects": batch, "Quiet": True})
        if response.get("Errors"):
            raise RuntimeError("Some stale off-site backup versions could not be deleted.")
        removed += len(batch)
    return removed


def purge_all_backup_and_audit_records() -> dict:
    with BACKUP_LOCK:
        backup_counts = clear_backup_copies()
        with db() as conn:
            cur = conn.execute("DELETE FROM audit_log")
            audit_removed = cur.rowcount
    return {**backup_counts, "auditEventsRemoved": audit_removed}


def maintenance_loop() -> None:
    while True:
        time.sleep(24 * 60 * 60)
        try:
            if retention_has_expired_records():
                clear_backup_copies()
            removed = apply_retention()
            audit_removed = apply_audit_retention()
            apply_analytics_retention()
            if removed or audit_removed:
                audit("system", "retention.purge", "records", f"Removed {removed} expired requests and {audit_removed} expired audit events")
            create_backup()
            # Keep 30 days of local rolling backups.
            from datetime import datetime, timedelta, timezone
            cutoff = datetime.now(timezone.utc) - timedelta(days=BACKUP_RETENTION_DAYS)
            for p in BACKUPS.glob("ginnery-*.zip"):
                if datetime.fromtimestamp(p.stat().st_mtime, timezone.utc) < cutoff:
                    p.unlink(missing_ok=True)
        except Exception as exc:
            print(f"Maintenance warning: {type(exc).__name__}")


def password_hash(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 310_000)
    return base64.urlsafe_b64encode(salt).decode() + "$" + base64.urlsafe_b64encode(digest).decode()


def password_matches(password: str, stored: str) -> bool:
    try:
        salt_text, digest_text = stored.split("$", 1)
        salt = base64.urlsafe_b64decode(salt_text.encode())
        expected = base64.urlsafe_b64decode(digest_text.encode())
        actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 310_000)
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


ROLE_PERMISSIONS = {
    "admin": {"reservations", "users", "content", "offers", "reports", "payments", "analytics", "marketing"},
    "manager": {"reservations", "content", "offers", "reports", "payments", "analytics", "marketing"},
    "website_manager": {"content", "offers", "analytics", "marketing"},
    "staff": {"reservations"},
}


def safe_user(row: sqlite3.Row) -> dict:
    return {"username": row["username"], "displayName": row["display_name"], "email": row["email"],
            "role": row["role"], "active": bool(row["active"]), "createdAt": row["created_at"],
            "permissions": sorted(ROLE_PERMISSIONS.get(row["role"], set()))}


def analytics_visitor_hash(value: object) -> str | None:
    visitor_id = str(value or "").strip().lower()
    if not re.fullmatch(r"[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}", visitor_id):
        return None
    return hmac.new(SECRET, visitor_id.encode("ascii"), hashlib.sha256).hexdigest()


def apply_analytics_retention() -> int:
    from datetime import datetime, timedelta, timezone
    cutoff = (datetime.now(timezone.utc) - timedelta(days=ANALYTICS_RETENTION_DAYS)).isoformat()
    with db() as conn:
        cur = conn.execute("DELETE FROM site_analytics WHERE created_at < ?", (cutoff,))
        conn.execute("DELETE FROM cookie_consents WHERE updated_at < ?", (cutoff,))
        conn.execute("UPDATE reservations SET analytics_visitor_hash=NULL WHERE created_at < ? AND analytics_visitor_hash IS NOT NULL", (cutoff,))
        return cur.rowcount


def utc_now() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()


def make_reference() -> str:
    from datetime import datetime
    stamp = datetime.now().strftime("%Y%m%d")
    while True:
        ref = f"GIN-{stamp}-{secrets.token_hex(2).upper()}"
        with db() as conn:
            found = conn.execute("SELECT 1 FROM reservations WHERE reference=?", (ref,)).fetchone()
        if not found:
            return ref


def row_to_record(row: sqlite3.Row) -> dict:
    try:
        payload = json.loads(row["payload_json"] or "{}")
    except (json.JSONDecodeError, TypeError):
        payload = {}
    currency = row["currency"] or "UGX"
    amount_due = int(row["amount_due_minor"] or 0)
    amount_paid = int(row["amount_paid_minor"] or 0)
    payment_status = row["payment_status"] or "Not collected"
    if amount_paid > 0:
        if amount_due == 0:
            payment_status = "Payment recorded · amount due not set"
        else:
            payment_status = "Paid" if amount_paid >= amount_due else "Partially paid"
    elif amount_due > 0:
        payment_status = "Awaiting payment"
    payload.update({
        "id": row["reference"], "reference": row["reference"],
        "createdAt": row["created_at"], "updatedAt": row["updated_at"],
        "service": row["service"], "guestName": row["guest_name"],
        "guestEmail": row["guest_email"], "guestPhone": row["guest_phone"],
        "dateSummary": row["date_summary"], "guestCount": row["guest_count"],
        "currency": currency, "status": row["status"],
        "paymentStatus": payment_status,
        "amountDueMinor": amount_due, "amountPaidMinor": amount_paid,
        "contactedAt": row["contacted_at"], "contactedBy": row["contacted_by"],
        "contactMethod": row["contact_method"], "contactNote": row["contact_note"],
        "contacted": bool(row["contacted_at"]),
        "transferRequested": bool(row["transfer_requested"]),
        "marketingConsent": bool(row["marketing_consent"]),
        "marketingConsentAt": row["marketing_consent_at"],
        "details": json.loads(row["details_json"] or "{}"),
    })
    return payload


def parse_money_minor(value: object, currency: str) -> int | None:
    if isinstance(value, bool) or currency not in {"UGX", "USD"}:
        return None
    raw = str(value).strip().replace(",", "")
    if not re.fullmatch(r"(?:0|[1-9][0-9]{0,11})(?:\.[0-9]{1,2})?", raw):
        return None
    try:
        amount = Decimal(raw)
    except InvalidOperation:
        return None
    factor = Decimal(100) if currency == "USD" else Decimal(1)
    minor = int((amount * factor).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    if minor < 0 or minor > 999_999_999_999:
        return None
    return minor


def sign(payload: str) -> str:
    return hmac.new(SECRET, payload.encode("utf-8"), hashlib.sha256).hexdigest()


def csrf_for(nonce: str) -> str:
    return hmac.new(SECRET, f"csrf:{nonce}".encode("utf-8"), hashlib.sha256).hexdigest()


def verify_cookie(cookie_value: str | None) -> tuple[bool, str, str, int]:
    if not cookie_value or "." not in cookie_value:
        return False, "", "", 0
    payload, supplied_sig = cookie_value.rsplit(".", 1)
    if not hmac.compare_digest(sign(payload), supplied_sig):
        return False, "", "", 0
    try:
        stamp_text, nonce, username, epoch_text = payload.split(".", 3)
        stamp = int(stamp_text)
        epoch = int(epoch_text)
    except (ValueError, TypeError):
        return False, "", "", 0
    if not nonce or not username or stamp > int(time.time()) + 60 or int(time.time()) - stamp > COOKIE_TTL:
        return False, "", "", 0
    return True, csrf_for(nonce), username, epoch


class GinneryHandler(BaseHTTPRequestHandler):
    server_version = "Ginnery"
    sys_version = ""
    _login_failures: dict[str, list[float]] = {}

    def log_message(self, fmt, *args):
        # Local development log, without query or guest request body data.
        print(f"[{self.log_date_time_string()}] {self.command} {urlsplit(self.path).path} - {args[1] if len(args) > 1 else ''}")

    def _send_bytes(self, body: bytes, status=200, content_type="application/octet-stream", extra_headers=None):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        self.send_header("Cache-Control", "no-store")
        if PRODUCTION:
            self.send_header("Strict-Transport-Security", "max-age=31536000")
        if extra_headers:
            for key, value in extra_headers.items():
                self.send_header(key, value)
        self.end_headers()
        self.wfile.write(body)

    def _json(self, obj: dict, status=200, extra_headers=None):
        self._send_bytes(json.dumps(obj, ensure_ascii=False).encode("utf-8"), status, "application/json; charset=utf-8", extra_headers)

    def _body_json(self, max_bytes=256 * 1024):
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        if length < 1 or length > max_bytes:
            return None
        try:
            value = json.loads(self.rfile.read(length).decode("utf-8"))
            return value if isinstance(value, dict) else None
        except (json.JSONDecodeError, UnicodeDecodeError):
            return None

    def _auth(self) -> tuple[bool, str]:
        cookie = SimpleCookie()
        try:
            cookie.load(self.headers.get("Cookie", ""))
            value = cookie[COOKIE_NAME].value if COOKIE_NAME in cookie else None
        except Exception:
            value = None
        authenticated, csrf, _username, _epoch = verify_cookie(value)
        return authenticated, csrf

    def _session(self):
        cookie = SimpleCookie()
        try:
            cookie.load(self.headers.get("Cookie", ""))
            value = cookie[COOKIE_NAME].value if COOKIE_NAME in cookie else None
        except Exception:
            value = None
        authenticated, csrf, username, epoch = verify_cookie(value)
        if not authenticated:
            return None, ""
        with db() as conn:
            row = conn.execute("SELECT * FROM staff_users WHERE username=? AND active=1", (username,)).fetchone()
        return (row, csrf) if row and int(row["auth_epoch"]) == epoch else (None, "")

    def _admin_required(self, permission: str | None = None) -> bool:
        row, _csrf = self._session()
        if not row:
            self._json({"ok": False, "error": "Staff sign-in required."}, HTTPStatus.UNAUTHORIZED)
            return False
        if permission and permission not in ROLE_PERMISSIONS.get(row["role"], set()):
            self._json({"ok": False, "error": "Your role does not allow this action."}, HTTPStatus.FORBIDDEN)
            return False
        return True

    def do_GET(self):
        path = unquote(urlsplit(self.path).path)
        if path == "/api/health":
            self._json({"ok": True, "mode": "production" if PRODUCTION else "local", "encryptedOffsiteBackups": bool(BACKUP_BUCKET and BACKUP_KMS_KEY), "liveInventory": False, "livePayments": False, "manualPaymentRecording": True})
            return
        if path == "/api/admin/me":
            row, csrf = self._session()
            self._json({"authenticated": bool(row), "csrfToken": csrf, "user": safe_user(row) if row else None})
            return
        if path == "/api/admin/reservations":
            if not self._admin_required("reservations"):
                return
            with db() as conn:
                rows = conn.execute("SELECT * FROM reservations ORDER BY created_at DESC").fetchall()
            self._json({"ok": True, "reservations": [row_to_record(row) for row in rows]})
            return
        if path == "/api/admin/marketing/recipients":
            if not self._admin_required("marketing"):
                return
            with db() as conn:
                rows = conn.execute(
                    """SELECT DISTINCT lower(trim(guest_email)) AS email
                       FROM reservations
                       WHERE marketing_consent=1 AND trim(guest_email)!=''
                         AND lower(trim(guest_email)) NOT IN (SELECT email FROM marketing_suppressions)
                       ORDER BY email"""
                ).fetchall()
            emails = [row["email"] for row in rows if re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", row["email"] or "")]
            self._json({"ok": True, "emails": emails, "count": len(emails)}, extra_headers={"Cache-Control": "no-store"})
            return
        if path.startswith("/api/admin/reservations/") and path.endswith("/payments"):
            if not self._admin_required("payments"):
                return
            reference = path[len("/api/admin/reservations/"):-len("/payments")].strip("/")
            with db() as conn:
                rows = conn.execute("SELECT * FROM payment_entries WHERE reservation_reference=? ORDER BY received_at DESC", (reference,)).fetchall()
            self._json({"ok": True, "payments": [{"id": r["id"], "amountMinor": r["amount_minor"], "currency": r["currency"], "method": r["method"], "reference": r["external_reference"], "note": r["note"], "receivedAt": r["received_at"], "receivedBy": r["received_by"]} for r in rows]})
            return
        if path == "/api/admin/offers":
            if not self._admin_required("offers"):
                return
            with db() as conn:
                rows = conn.execute("SELECT * FROM offers ORDER BY created_at DESC").fetchall()
            self._json({"ok": True, "offers": [{"id":r["id"],"name":r["name"],"audience":r["audience"],"service":r["service"],"start":r["start_date"],"end":r["end_date"],"details":r["details"],"promoCode":r["promo_code"],"published":bool(r["published"]),"createdAt":r["created_at"]} for r in rows]})
            return
        if path == "/api/admin/users":
            actor, _csrf = self._session()
            if not actor:
                self._json({"ok": False, "error": "Staff sign-in required."}, HTTPStatus.UNAUTHORIZED); return
            if actor["role"] not in {"admin", "manager"}:
                self._json({"ok": False, "error": "Your role cannot view staff accounts."}, HTTPStatus.FORBIDDEN); return
            q = urlsplit(self.path).query
            from urllib.parse import parse_qs
            query = parse_qs(q).get("q", [""])[0].strip().lower()[:80]
            with db() as conn:
                if actor["role"] == "manager":
                    rows = conn.execute("SELECT * FROM staff_users WHERE role='staff' ORDER BY display_name").fetchall()
                else:
                    rows = conn.execute("SELECT * FROM staff_users ORDER BY role,display_name").fetchall()
            users = [safe_user(row) for row in rows if not query or query in (row["username"]+" "+row["display_name"]+" "+row["email"]+" "+row["role"]).lower()]
            self._json({"ok": True, "users": users})
            return
        if path == "/api/admin/content":
            if not self._admin_required("content"):
                return
            with db() as conn:
                row = conn.execute("SELECT draft_json,published_json,updated_at FROM site_content WHERE id=1").fetchone()
            draft = json.loads(row["draft_json"]) if row else {}
            published = json.loads(row["published_json"]) if row else {}
            self._json({"ok": True, "content": draft, "publishedPosts": published.get("posts", []), "updatedAt": row["updated_at"] if row else None})
            return
        if path == "/api/admin/analytics":
            if not self._admin_required("analytics"):
                return
            from datetime import datetime, timedelta, timezone
            cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
            with db() as conn:
                visitors = int(conn.execute("SELECT COUNT(DISTINCT visitor_hash) FROM site_analytics WHERE event_type='page_view' AND created_at>=?", (cutoff,)).fetchone()[0])
                page_views = int(conn.execute("SELECT COUNT(*) FROM site_analytics WHERE event_type='page_view' AND created_at>=?", (cutoff,)).fetchone()[0])
                inquiry_count = int(conn.execute("SELECT COUNT(*) FROM reservations WHERE created_at>=?", (cutoff,)).fetchone()[0])
                converted_sessions = int(conn.execute("SELECT COUNT(DISTINCT r.analytics_visitor_hash) FROM reservations r JOIN site_analytics a ON a.visitor_hash=r.analytics_visitor_hash AND a.event_type='page_view' AND a.created_at>=? WHERE r.created_at>=? AND r.analytics_visitor_hash IS NOT NULL", (cutoff, cutoff)).fetchone()[0])
                post_rows = conn.execute("SELECT post_id,COUNT(*) AS views,COUNT(DISTINCT visitor_hash) AS visitors FROM site_analytics WHERE event_type='post_view' AND created_at>=? GROUP BY post_id ORDER BY views DESC,visitors DESC LIMIT 10", (cutoff,)).fetchall()
                page_rows = conn.execute("SELECT page_path,COUNT(*) AS views,COUNT(DISTINCT visitor_hash) AS visitors FROM site_analytics WHERE event_type='page_view' AND created_at>=? GROUP BY page_path ORDER BY views DESC LIMIT 8", (cutoff,)).fetchall()
                content_row = conn.execute("SELECT published_json FROM site_content WHERE id=1").fetchone()
            try:
                published = json.loads(content_row["published_json"]) if content_row else {}
            except (json.JSONDecodeError, TypeError):
                published = {}
            titles = {str(post.get("id", "")): str(post.get("title", "")) for post in published.get("posts", []) if isinstance(post, dict)}
            self._json({"ok": True, "periodDays": 30, "visitorSessions": visitors, "pageViews": page_views,
                        "inquiries": inquiry_count, "convertedSessions": converted_sessions,
                        "conversionRate": round(converted_sessions / visitors * 100, 1) if visitors else 0,
                        "topPosts": [{"id": row["post_id"], "title": titles.get(row["post_id"]) or "Removed or unpublished story", "views": row["views"], "visitors": row["visitors"]} for row in post_rows],
                        "topPages": [{"page": row["page_path"], "views": row["views"], "visitors": row["visitors"]} for row in page_rows],
                        "retentionDays": ANALYTICS_RETENTION_DAYS})
            return
        if path == "/api/admin/system":
            if not self._admin_required("users"):
                return
            with db() as conn:
                audit_rows = conn.execute("SELECT created_at,actor,action,target,detail FROM audit_log ORDER BY id DESC LIMIT 100").fetchall()
                audit_event_count = int(conn.execute("SELECT COUNT(*) FROM audit_log").fetchone()[0])
            all_backups = list(BACKUPS.glob("ginnery-*.zip"))
            backup_count = len(all_backups)
            backups = sorted(all_backups, key=lambda p: p.stat().st_mtime, reverse=True)[:30]
            from datetime import datetime, timedelta, timezone
            offsite_backup = bool(BACKUP_BUCKET and BACKUP_KMS_KEY)
            remote_stale_count = 0
            remote_backup_count = 0 if not offsite_backup else None
            offsite_check_error = False
            if offsite_backup:
                try:
                    remote_backup_count = count_remote_backups()
                    remote_stale_count = len(stale_remote_backups(datetime.now(timezone.utc) - timedelta(days=BACKUP_RETENTION_DAYS)))
                except Exception:
                    remote_backup_count = None
                    remote_stale_count = None
                    offsite_check_error = True
            self._json({"ok": True, "retentionDays": retention_days(), "auditRetentionDays": audit_retention_days(),
                        "auditEventCount": audit_event_count, "localBackupCount": backup_count,
                        "audit": [dict(row) for row in audit_rows],
                        "backups": [{"name": p.name, "size": p.stat().st_size, "createdAt": __import__('datetime').datetime.fromtimestamp(p.stat().st_mtime, __import__('datetime').timezone.utc).isoformat()} for p in backups],
                        "cleanupPreview": {"localBackups": len(stale_local_backups()), "offsiteBackups": remote_stale_count, "offsiteCheckError": offsite_check_error, "auditEvents": expired_audit_events_count(), "backupRetentionDays": BACKUP_RETENTION_DAYS},
                        "offsiteBackup": offsite_backup, "remoteBackupCount": remote_backup_count,
                        "integrations": {"payments": "not-configured", "pms": "not-configured"}})
            return
        if path.startswith("/api/admin/backups/"):
            if not self._admin_required("users"):
                return
            name = path.rsplit("/", 1)[-1]
            if not re.fullmatch(r"ginnery-[0-9TZ]+\.zip", name):
                self._json({"ok": False, "error": "Backup not found."}, HTTPStatus.NOT_FOUND); return
            target = BACKUPS / name
            try:
                self._send_bytes(target.read_bytes(), 200, "application/zip", {"Content-Disposition": f'attachment; filename="{name}"'})
            except OSError:
                self._json({"ok": False, "error": "Backup not found."}, HTTPStatus.NOT_FOUND)
            return
        if path == "/api/site/offers":
            from datetime import datetime, timedelta, timezone
            local_today = datetime.now(timezone(timedelta(hours=3))).date().isoformat()
            with db() as conn:
                rows = conn.execute("SELECT id,name,audience,service,start_date,end_date,details,promo_code FROM offers WHERE published=1 AND (start_date IS NULL OR start_date='' OR start_date<=?) AND (end_date IS NULL OR end_date='' OR end_date>=?) ORDER BY created_at DESC", (local_today, local_today)).fetchall()
            self._json({"ok": True, "offers": [{"id":r["id"],"name":r["name"],"audience":r["audience"],"service":r["service"],"start":r["start_date"],"end":r["end_date"],"details":r["details"],"promoCode":r["promo_code"]} for r in rows]})
            return
        if path == "/api/site/content":
            with db() as conn:
                row = conn.execute("SELECT published_json,updated_at FROM site_content WHERE id=1").fetchone()
            self._json({"ok": True, "content": json.loads(row["published_json"]) if row else {}, "updatedAt": row["updated_at"] if row else None})
            return
        if path.startswith("/uploads/"):
            name = path.rsplit("/", 1)[-1]
            if not re.fullmatch(r"[a-f0-9]{32}\.(jpg|png|webp)", name):
                self._json({"ok": False, "error": "Not found."}, HTTPStatus.NOT_FOUND)
                return
            p = UPLOADS / name
            try:
                mime = {"jpg": "image/jpeg", "png": "image/png", "webp": "image/webp"}[p.suffix[1:]]
                self._send_bytes(p.read_bytes(), 200, mime, {"Cache-Control": "public, max-age=31536000, immutable"})
            except OSError:
                self._json({"ok": False, "error": "Not found."}, HTTPStatus.NOT_FOUND)
            return
        if path == "/":
            path = "/index.html"
        filename = path.lstrip("/")
        if filename not in ALLOWED_FILES or (PRODUCTION and filename not in PRODUCTION_FILES):
            self._json({"ok": False, "error": "Not found."}, HTTPStatus.NOT_FOUND)
            return
        p = ROOT / filename
        mime = ("text/html; charset=utf-8" if p.suffix == ".html" else
                "image/jpeg" if p.suffix.lower() in {".jpg", ".jpeg"} else
                "text/css; charset=utf-8" if p.suffix == ".css" else
                "text/javascript; charset=utf-8" if p.suffix == ".js" else
                "image/png" if p.suffix == ".png" else
                "text/plain; charset=utf-8" if p.suffix in {".txt", ".md"} else
                "application/octet-stream")
        try:
            self._send_bytes(p.read_bytes(), 200, mime)
        except OSError:
            self._json({"ok": False, "error": "File not found."}, HTTPStatus.NOT_FOUND)

    def do_POST(self):
        path = unquote(urlsplit(self.path).path)
        data = self._body_json(9 * 1024 * 1024) if path == "/api/admin/media" else self._body_json()
        if path == "/api/privacy/consent":
            if not isinstance(data, dict) or not isinstance(data.get("analytics"), bool):
                self._json({"ok": False, "error": "Choose whether optional analytics are allowed."}, HTTPStatus.BAD_REQUEST); return
            consent_hash = analytics_visitor_hash(data.get("consentId"))
            if not consent_hash:
                self._json({"ok": False, "error": "Refresh the page and save your privacy choice again."}, HTTPStatus.BAD_REQUEST); return
            now = utc_now()
            with db() as conn:
                conn.execute("INSERT INTO cookie_consents(consent_hash,analytics_enabled,created_at,updated_at) VALUES(?,?,?,?) ON CONFLICT(consent_hash) DO UPDATE SET analytics_enabled=excluded.analytics_enabled,updated_at=excluded.updated_at", (consent_hash, int(data["analytics"]), now, now))
            self._json({"ok": True, "saved": True})
            return
        if path == "/api/analytics/event":
            if not isinstance(data, dict):
                self._json({"ok": False, "error": "Invalid analytics event."}, HTTPStatus.BAD_REQUEST); return
            event_type = str(data.get("event", ""))
            page_path = str(data.get("page", ""))
            visitor_hash = analytics_visitor_hash(data.get("visitorId"))
            consent_hash = analytics_visitor_hash(data.get("consentId"))
            post_id = str(data.get("postId", ""))
            allowed_pages = {"index.html", "explore.html", "booking.html"}
            if event_type not in {"page_view", "post_view"} or page_path not in allowed_pages or not visitor_hash or not consent_hash:
                self._json({"ok": False, "error": "Invalid analytics event."}, HTTPStatus.BAD_REQUEST); return
            with db() as conn:
                consent = conn.execute("SELECT analytics_enabled FROM cookie_consents WHERE consent_hash=?", (consent_hash,)).fetchone()
            if not consent or not consent["analytics_enabled"]:
                self._json({"ok": True, "ignored": True}, HTTPStatus.ACCEPTED); return
            if event_type == "post_view":
                if not re.fullmatch(r"[a-zA-Z0-9_-]{1,40}", post_id):
                    self._json({"ok": True, "ignored": True}, HTTPStatus.ACCEPTED); return
                with db() as conn:
                    row = conn.execute("SELECT published_json FROM site_content WHERE id=1").fetchone()
                try:
                    published = json.loads(row["published_json"]) if row else {}
                    published_post_ids = {str(post.get("id", "")) for post in published.get("posts", []) if isinstance(post, dict)}
                except (json.JSONDecodeError, TypeError):
                    published_post_ids = set()
                if post_id not in published_post_ids:
                    self._json({"ok": True, "ignored": True}, HTTPStatus.ACCEPTED); return
            from datetime import datetime, timedelta, timezone
            created_at = utc_now()
            recent_cutoff = (datetime.now(timezone.utc) - timedelta(seconds=30)).isoformat()
            stored_post_id = post_id if event_type == "post_view" else ""
            with db() as conn:
                duplicate = conn.execute("SELECT 1 FROM site_analytics WHERE event_type=? AND visitor_hash=? AND page_path=? AND post_id=? AND created_at>=? LIMIT 1", (event_type, visitor_hash, page_path, stored_post_id, recent_cutoff)).fetchone()
                if not duplicate:
                    conn.execute("INSERT INTO site_analytics(created_at,event_type,visitor_hash,page_path,post_id) VALUES(?,?,?,?,?)", (created_at, event_type, visitor_hash, page_path, stored_post_id))
            self._json({"ok": True, "duplicate": bool(duplicate)}, HTTPStatus.ACCEPTED)
            return
        if path == "/api/reservations":
            if not isinstance(data, dict):
                self._json({"ok": False, "error": "Expected a JSON request."}, HTTPStatus.BAD_REQUEST)
                return
            service = str(data.get("service", "")).strip()
            name = str(data.get("guestName", "")).strip()
            email = str(data.get("guestEmail", "")).strip()
            phone = str(data.get("guestPhone", "")).strip()
            if service not in VALID_SERVICES or not name or len(name) > 120 or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email) or len(phone) < 6 or len(phone) > 40:
                self._json({"ok": False, "error": "Service, full name, valid email and phone are required."}, HTTPStatus.BAD_REQUEST)
                return
            raw_details = data.get("details") if isinstance(data.get("details"), dict) else {}
            details = {str(key)[:60]: str(value).strip()[:1200] for key, value in raw_details.items()
                       if isinstance(key, str) and isinstance(value, (str, int, float, bool))}
            if service == "events":
                from datetime import date, datetime, timedelta, timezone
                local_today = datetime.now(timezone(timedelta(hours=3))).date()
                try:
                    event_date = date.fromisoformat(details.get("eventDate", ""))
                    allowed_types = {"Corporate meeting", "Private celebration", "Wedding", "Conference", "Other"}
                    allowed_attendance = {"Up to 10", "11–25", "26–50", "51–100", "100+", "Not sure yet"}
                    allowed_formats = {"Seated", "Standing / reception", "Meeting", "Not sure"}
                    allowed_budgets = {"Not sure yet", "Under UGX 1,000,000", "UGX 1,000,000–5,000,000", "UGX 5,000,000–15,000,000", "Over UGX 15,000,000"}
                    allowed_rooms = {"No / not sure", "Yes, please discuss rooms"}
                    if (event_date < local_today or details.get("eventType") not in allowed_types
                            or details.get("attendees") not in allowed_attendance
                            or details.get("eventFormat") not in allowed_formats
                            or details.get("eventBudget") not in allowed_budgets
                            or details.get("eventAccommodation") not in allowed_rooms):
                        raise ValueError()
                except (TypeError, ValueError):
                    self._json({"ok": False, "error": "Choose a valid event date, type, attendance, setup and budget preference."}, HTTPStatus.BAD_REQUEST); return
            if service in {"paddle", "mini_golf"}:
                from datetime import datetime, timedelta, timezone
                date_key, time_key = ("paddleDate", "paddleTime") if service == "paddle" else ("golfDate", "golfTime")
                players_key = "paddlePlayers" if service == "paddle" else "golfPlayers"
                option_key = "paddleDuration" if service == "paddle" else "golfRounds"
                allowed_players = {"2", "4", "5", "6", "Other / not sure"} if service == "paddle" else {"1", "2", "4", "5", "6", "Other / not sure"}
                allowed_options = {"30 minutes", "1 hour", "90 minutes", "2 hours", "Not sure"} if service == "paddle" else {"1", "2", "Not sure"}
                try:
                    local_zone = timezone(timedelta(hours=3))
                    requested_at = datetime.fromisoformat(f"{details[date_key]}T{details[time_key]}").replace(tzinfo=local_zone)
                    if requested_at <= datetime.now(local_zone) or str(details.get(players_key, "")) not in allowed_players or str(details.get(option_key, "")) not in allowed_options:
                        raise ValueError()
                except (KeyError, TypeError, ValueError):
                    self._json({"ok": False, "error": "Choose a future session date and time, group size and session option."}, HTTPStatus.BAD_REQUEST)
                    return
                if not str(data.get("dateSummary", "")).strip():
                    data["dateSummary"] = f"{details[date_key]} · {details[time_key]}"
            if service == "spa":
                from datetime import datetime, timedelta, timezone
                try:
                    local_zone = timezone(timedelta(hours=3))
                    requested_at = datetime.fromisoformat(f"{details['spaDate']}T{details['spaTime']}").replace(tzinfo=local_zone)
                    guests = str(details.get("spaGuests", ""))
                    duration = str(details.get("spaDuration", ""))
                    treatment = str(details.get("spaTreatment", "")).strip()
                    if (requested_at <= datetime.now(local_zone) or guests not in {"1", "2", "3", "4"}
                            or duration not in {"30 minutes", "60 minutes", "90 minutes", "Not sure"}
                            or not treatment or len(treatment) > 160):
                        raise ValueError()
                except (KeyError, TypeError, ValueError):
                    self._json({"ok": False, "error": "Choose a future date and time, guest count, and treatment request."}, HTTPStatus.BAD_REQUEST); return
                data["dateSummary"] = f"{details['spaDate']} · {details['spaTime']}"
                data["guestCount"] = f"{guests} spa guest(s)"
            offer_id = str(data.get("offerId", "")).strip()
            if offer_id:
                from datetime import datetime, timedelta, timezone
                local_today = datetime.now(timezone(timedelta(hours=3))).date().isoformat()
                if not re.fullmatch(r"OFF-[A-F0-9]{12}", offer_id):
                    self._json({"ok": False, "error": "This offer reference is invalid."}, HTTPStatus.BAD_REQUEST); return
                with db() as conn:
                    offer = conn.execute("SELECT id,name,service,promo_code FROM offers WHERE id=? AND published=1 AND (start_date IS NULL OR start_date='' OR start_date<=?) AND (end_date IS NULL OR end_date='' OR end_date>=?)", (offer_id, local_today, local_today)).fetchone()
                if not offer or offer["service"] != service:
                    self._json({"ok": False, "error": "This offer is no longer available for the selected service. Refresh Explore and choose a current package."}, HTTPStatus.BAD_REQUEST); return
                details["offerId"] = offer["id"]
                details["offerName"] = offer["name"]
                details["offerPromoCode"] = offer["promo_code"]
            reference = make_reference()
            created = utc_now()
            currency = "USD" if data.get("currency") == "USD" else "UGX"
            visitor_hash = analytics_visitor_hash(data.get("analyticsVisitorId"))
            consent_hash = analytics_visitor_hash(data.get("analyticsConsentId"))
            if visitor_hash and consent_hash:
                with db() as conn:
                    consent = conn.execute("SELECT analytics_enabled FROM cookie_consents WHERE consent_hash=?", (consent_hash,)).fetchone()
                if not consent or not consent["analytics_enabled"]:
                    visitor_hash = None
            else:
                visitor_hash = None
            payload = dict(data)
            payload["details"] = details
            payload.pop("analyticsVisitorId", None)
            payload.pop("analyticsConsentId", None)
            payload.pop("id", None)
            payload.pop("reference", None)
            payload["status"] = "New request"
            payload["paymentStatus"] = "Not collected"
            marketing_consent = data.get("marketingConsent") is True
            payload["marketingConsent"] = marketing_consent
            try:
                with db() as conn:
                    conn.execute(
                        """INSERT INTO reservations
                        (reference,created_at,service,guest_name,guest_email,guest_phone,date_summary,guest_count,currency,status,payment_status,transfer_requested,marketing_consent,marketing_consent_at,payload_json,details_json,analytics_visitor_hash)
                        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                        (reference, created, service, name, email, phone, str(data.get("dateSummary", ""))[:160],
                         str(data.get("guestCount", ""))[:80], currency, "New request", "Not collected",
                         int(bool(data.get("transferRequested"))), int(marketing_consent), created if marketing_consent else None,
                         json.dumps(payload, ensure_ascii=False), json.dumps(details, ensure_ascii=False), visitor_hash),
                    )
                    row = conn.execute("SELECT * FROM reservations WHERE reference=?", (reference,)).fetchone()
                audit("guest", "reservation.create", reference, service)
                self._json({"ok": True, "mode": "production" if PRODUCTION else "local", "reservation": row_to_record(row), "notice": "Your request is recorded for hotel review. It is not confirmed until availability, pricing and terms are agreed."}, HTTPStatus.CREATED)
            except sqlite3.Error:
                self._json({"ok": False, "error": "The request could not be saved. Please try again."}, HTTPStatus.INTERNAL_SERVER_ERROR)
            return
        if path == "/api/admin/login":
            if not isinstance(data, dict):
                self._json({"ok": False, "error": "Expected username and password."}, HTTPStatus.BAD_REQUEST)
                return
            username = str(data.get("username", ""))
            password = str(data.get("password", ""))
            peer = self.client_address[0]
            if os.environ.get("GINNERY_TRUSTED_PROXY") == "1":
                forwarded = self.headers.get("X-Forwarded-For", "").split(",", 1)[0].strip()
                try:
                    peer = ipaddress.ip_address(forwarded).compressed
                except ValueError:
                    pass
            now = time.time()
            recent = [t for t in self._login_failures.get(peer, []) if now-t < 900]
            if len(recent) >= 10:
                self._login_failures[peer] = recent
                self._json({"ok": False, "error": "Too many sign-in attempts. Wait 15 minutes and try again."}, HTTPStatus.TOO_MANY_REQUESTS)
                return
            with db() as conn:
                user = conn.execute("SELECT * FROM staff_users WHERE username=? AND active=1", (username,)).fetchone()
            if user and password_matches(password, user["password_hash"]):
                stamp = str(int(time.time()))
                nonce = secrets.token_urlsafe(24)
                payload = f"{stamp}.{nonce}.{username}.{user['auth_epoch']}"
                cookie_value = f"{payload}.{sign(payload)}"
                cookie = session_cookie(cookie_value)
                self._json({"ok": True, "csrfToken": csrf_for(nonce), "user": safe_user(user)}, extra_headers={"Set-Cookie": cookie})
                audit(username, "auth.login", username)
            else:
                recent.append(now)
                self._login_failures[peer] = recent
                self._json({"ok": False, "error": "The username or password was not accepted."}, HTTPStatus.UNAUTHORIZED)
            return
        if path == "/api/admin/password":
            actor, csrf = self._session()
            if not actor:
                self._json({"ok": False, "error": "Staff sign-in required."}, HTTPStatus.UNAUTHORIZED); return
            if not hmac.compare_digest(self.headers.get("X-CSRF-Token", ""), csrf):
                self._json({"ok": False, "error": "Invalid session token. Refresh the page and try again."}, HTTPStatus.FORBIDDEN); return
            if not isinstance(data, dict):
                self._json({"ok": False, "error": "Enter your current and new passwords."}, HTTPStatus.BAD_REQUEST); return
            current = str(data.get("currentPassword", ""))
            new_password = str(data.get("newPassword", ""))
            confirmation = data.get("confirmPassword")
            if confirmation is not None and str(confirmation) != new_password:
                self._json({"ok": False, "error": "The new passwords do not match."}, HTTPStatus.BAD_REQUEST); return
            if len(new_password) < 12 or len(new_password) > 256 or new_password == current:
                self._json({"ok": False, "error": "Choose a different password between 12 and 256 characters."}, HTTPStatus.BAD_REQUEST); return
            if not password_matches(current, actor["password_hash"]):
                self._json({"ok": False, "error": "Current password is incorrect."}, HTTPStatus.FORBIDDEN); return

            now = utc_now()
            try:
                with db() as conn:
                    conn.execute("BEGIN IMMEDIATE")
                    latest = conn.execute("SELECT password_hash FROM staff_users WHERE username=? AND active=1", (actor["username"],)).fetchone()
                    if not latest or not password_matches(current, latest["password_hash"]):
                        conn.rollback()
                        self._json({"ok": False, "error": "The current password changed in another session. Sign in again and retry."}, HTTPStatus.FORBIDDEN); return
                    cursor = conn.execute(
                        "UPDATE staff_users SET password_hash=?,updated_at=?,auth_epoch=auth_epoch+1 WHERE username=? AND active=1",
                        (password_hash(new_password), now, actor["username"]),
                    )
                    if cursor.rowcount != 1:
                        conn.rollback()
                        self._json({"ok": False, "error": "The account could not be updated. Sign in again and retry."}, HTTPStatus.CONFLICT); return
                    updated = conn.execute("SELECT auth_epoch FROM staff_users WHERE username=?", (actor["username"],)).fetchone()
                    conn.execute(
                        "INSERT INTO audit_log(created_at,actor,action,target,detail) VALUES(?,?,?,?,?)",
                        (now, actor["username"][:80], "auth.password_change", actor["username"][:120], ""),
                    )
                    conn.commit()
            except sqlite3.Error:
                self._json({"ok": False, "error": "The password could not be saved. Please try again."}, HTTPStatus.SERVICE_UNAVAILABLE); return

            with db() as verify_conn:
                persisted = verify_conn.execute("SELECT password_hash FROM staff_users WHERE username=? AND active=1", (actor["username"],)).fetchone()
            if not persisted or not password_matches(new_password, persisted["password_hash"]):
                self._json({"ok": False, "error": "The server could not verify the saved password. Contact an administrator before signing out."}, HTTPStatus.INTERNAL_SERVER_ERROR); return
            if actor["role"] == "admin":
                credential_file = INSTANCE / "initial-admin-credentials.txt"
                try:
                    credential_file.unlink(missing_ok=True)
                except OSError as exc:
                    print(f"Password update warning: bootstrap credential cleanup failed ({type(exc).__name__}).")
            stamp = str(int(time.time())); nonce = secrets.token_urlsafe(24)
            payload = f"{stamp}.{nonce}.{actor['username']}.{updated['auth_epoch']}"
            cookie = session_cookie(f"{payload}.{sign(payload)}")
            self._json({"ok": True, "passwordChanged": True, "sessionRenewed": True, "csrfToken": csrf_for(nonce)}, extra_headers={"Set-Cookie": cookie})
            return
        if path.startswith("/api/admin/users/") and path.endswith("/password"):
            actor, csrf = self._session()
            if not actor:
                self._json({"ok": False, "error": "Staff sign-in required."}, HTTPStatus.UNAUTHORIZED); return
            if actor["role"] != "admin":
                self._json({"ok": False, "error": "Only an administrator can reset another account's password."}, HTTPStatus.FORBIDDEN); return
            if not hmac.compare_digest(self.headers.get("X-CSRF-Token", ""), csrf):
                self._json({"ok": False, "error": "Invalid session token."}, HTTPStatus.FORBIDDEN); return
            target = path[len("/api/admin/users/"):-len("/password")].strip("/")
            new_password = str((data or {}).get("newPassword", ""))
            if not re.fullmatch(r"[a-z0-9_-]{3,40}", target) or len(new_password) < 12 or len(new_password) > 256:
                self._json({"ok": False, "error": "Choose a temporary password between 12 and 256 characters."}, HTTPStatus.BAD_REQUEST); return
            with db() as conn:
                user = conn.execute("SELECT username FROM staff_users WHERE username=? AND role!='admin'", (target,)).fetchone()
                if not user:
                    self._json({"ok": False, "error": "Account not found or cannot be reset here."}, HTTPStatus.NOT_FOUND); return
                conn.execute("UPDATE staff_users SET password_hash=?,updated_at=?,auth_epoch=auth_epoch+1 WHERE username=?", (password_hash(new_password), utc_now(), target))
            audit(actor["username"], "user.password_reset", target, "Admin-issued temporary password")
            self._json({"ok": True, "username": target, "sessionsRevoked": True})
            return
        if path.startswith("/api/admin/reservations/") and path.endswith("/contact"):
            actor, csrf = self._session()
            if not actor:
                self._json({"ok": False, "error": "Staff sign-in required."}, HTTPStatus.UNAUTHORIZED); return
            if "reservations" not in ROLE_PERMISSIONS.get(actor["role"], set()):
                self._json({"ok": False, "error": "Your role cannot contact guests."}, HTTPStatus.FORBIDDEN); return
            if not hmac.compare_digest(self.headers.get("X-CSRF-Token", ""), csrf):
                self._json({"ok": False, "error": "Invalid session token."}, HTTPStatus.FORBIDDEN); return
            reference = path[len("/api/admin/reservations/"):-len("/contact")].strip("/")
            method = str((data or {}).get("method", "")).strip().lower()
            note = str((data or {}).get("note", "")).strip()[:400]
            if method not in {"phone", "whatsapp", "email", "in_person", "other"} or not reference:
                self._json({"ok": False, "error": "Choose how you contacted the guest."}, HTTPStatus.BAD_REQUEST); return
            contacted_at = utc_now()
            with db() as conn:
                exists = conn.execute("SELECT 1 FROM reservations WHERE reference=?", (reference,)).fetchone()
                if not exists:
                    self._json({"ok": False, "error": "Request not found."}, HTTPStatus.NOT_FOUND); return
                conn.execute("INSERT INTO contact_events(reservation_reference,contacted_at,contacted_by,method,note) VALUES(?,?,?,?,?)", (reference, contacted_at, actor["username"], method, note))
                conn.execute("UPDATE reservations SET contacted_at=?,contacted_by=?,contact_method=?,contact_note=?,status=CASE WHEN status='New request' THEN 'Contacted' ELSE status END,updated_at=? WHERE reference=?", (contacted_at, actor["username"], method, note, contacted_at, reference))
                row = conn.execute("SELECT * FROM reservations WHERE reference=?", (reference,)).fetchone()
            audit(actor["username"], "reservation.contact", reference, f"method={method}; note={note[:100]}")
            self._json({"ok": True, "reservation": row_to_record(row)})
            return
        if path.startswith("/api/admin/reservations/") and path.endswith("/payments"):
            actor, csrf = self._session()
            if not actor:
                self._json({"ok": False, "error": "Staff sign-in required."}, HTTPStatus.UNAUTHORIZED); return
            if "payments" not in ROLE_PERMISSIONS.get(actor["role"], set()):
                self._json({"ok": False, "error": "Your role cannot record payments."}, HTTPStatus.FORBIDDEN); return
            if not hmac.compare_digest(self.headers.get("X-CSRF-Token", ""), csrf):
                self._json({"ok": False, "error": "Invalid session token."}, HTTPStatus.FORBIDDEN); return
            reference = path[len("/api/admin/reservations/"):-len("/payments")].strip("/")
            method = str((data or {}).get("method", "")).strip().lower()
            if method not in {"cash", "bank_transfer", "mobile_money", "card", "other"} or not reference:
                self._json({"ok": False, "error": "Choose the payment method."}, HTTPStatus.BAD_REQUEST); return
            with db() as conn:
                row = conn.execute("SELECT * FROM reservations WHERE reference=?", (reference,)).fetchone()
                if not row:
                    self._json({"ok": False, "error": "Request not found."}, HTTPStatus.NOT_FOUND); return
                due = int(row["amount_due_minor"] or 0)
                paid = int(row["amount_paid_minor"] or 0)
                remaining = max(0, due - paid)
                full_balance = (data or {}).get("fullBalance") is True
                if due > 0 and remaining <= 0:
                    self._json({"ok": False, "error": "This request has no outstanding balance."}, HTTPStatus.CONFLICT); return
                if full_balance:
                    if due <= 0:
                        self._json({"ok": False, "error": "No amount due is set. Enter the amount actually received."}, HTTPStatus.BAD_REQUEST); return
                    amount_minor = remaining
                else:
                    amount_minor = parse_money_minor((data or {}).get("amount"), row["currency"] or "UGX")
                if amount_minor is None or amount_minor <= 0 or (due > 0 and amount_minor > remaining):
                    self._json({"ok": False, "error": "Enter a positive amount up to the remaining balance."}, HTTPStatus.BAD_REQUEST); return
                now = utc_now()
                payment_reference = str((data or {}).get("reference", "")).strip()[:120]
                note = str((data or {}).get("note", "")).strip()[:300]
                conn.execute("INSERT INTO payment_entries(reservation_reference,amount_minor,currency,method,external_reference,note,received_at,received_by) VALUES(?,?,?,?,?,?,?,?)", (reference, amount_minor, row["currency"], method, payment_reference, note, now, actor["username"]))
                new_paid = paid + amount_minor
                status = ("Paid" if new_paid >= due else "Partially paid") if due > 0 else "Payment recorded"
                conn.execute("UPDATE reservations SET amount_paid_minor=?,payment_status=?,updated_at=? WHERE reference=?", (new_paid, status, now, reference))
                updated = conn.execute("SELECT * FROM reservations WHERE reference=?", (reference,)).fetchone()
            audit(actor["username"], "payment.confirm", reference, f"amountMinor={amount_minor}; currency={row['currency']}; method={method}")
            self._json({"ok": True, "reservation": row_to_record(updated), "payment": {"amountMinor": amount_minor, "currency": row["currency"], "method": method, "receivedAt": now}})
            return
        if path.startswith("/api/admin/offers/"):
            actor, csrf = self._session()
            if not actor:
                self._json({"ok": False, "error": "Staff sign-in required."}, HTTPStatus.UNAUTHORIZED); return
            if "offers" not in ROLE_PERMISSIONS.get(actor["role"], set()):
                self._json({"ok": False, "error": "Your role cannot manage offers."}, HTTPStatus.FORBIDDEN); return
            if not hmac.compare_digest(self.headers.get("X-CSRF-Token", ""), csrf):
                self._json({"ok": False, "error": "Invalid session token."}, HTTPStatus.FORBIDDEN); return
            offer_id = path.rsplit("/", 1)[-1]
            action = str((data or {}).get("action", ""))
            if action not in {"publish", "unpublish"} or not re.fullmatch(r"OFF-[A-F0-9]{12}", offer_id):
                self._json({"ok": False, "error": "Choose a valid offer publishing action."}, HTTPStatus.BAD_REQUEST); return
            with db() as conn:
                offer = conn.execute("SELECT * FROM offers WHERE id=?", (offer_id,)).fetchone()
                if not offer:
                    self._json({"ok": False, "error": "Offer not found."}, HTTPStatus.NOT_FOUND); return
                if action == "publish" and (not offer["details"] or not offer["start_date"] or not offer["end_date"]):
                    self._json({"ok": False, "error": "Add the confirmed inclusions and start/end dates before publishing this offer."}, HTTPStatus.BAD_REQUEST); return
                published = int(action == "publish")
                conn.execute("UPDATE offers SET published=? WHERE id=?", (published, offer_id))
            audit(actor["username"], "offer.publish" if published else "offer.unpublish", offer_id, offer["name"])
            self._json({"ok": True, "id": offer_id, "published": bool(published)})
            return
        if path == "/api/admin/offers":
            actor, csrf = self._session()
            if not actor:
                self._json({"ok": False, "error": "Staff sign-in required."}, HTTPStatus.UNAUTHORIZED); return
            if "offers" not in ROLE_PERMISSIONS.get(actor["role"], set()):
                self._json({"ok": False, "error": "Your role cannot manage offers."}, HTTPStatus.FORBIDDEN); return
            if not hmac.compare_digest(self.headers.get("X-CSRF-Token", ""), csrf):
                self._json({"ok": False, "error": "Invalid session token."}, HTTPStatus.FORBIDDEN); return
            name = str((data or {}).get("name", "")).strip()[:120]
            audience = str((data or {}).get("audience", "")).strip()[:80]
            service = str((data or {}).get("service", "stay")).strip()
            details = str((data or {}).get("details", "")).strip()[:2000]
            start = str((data or {}).get("start", ""))[:10]
            end = str((data or {}).get("end", ""))[:10]
            if not name or not audience or service not in VALID_SERVICES or (start and end and end < start):
                self._json({"ok": False, "error": "Provide an offer name and audience, with a valid date range."}, HTTPStatus.BAD_REQUEST); return
            offer_id = "OFF-" + secrets.token_hex(6).upper(); created = utc_now()
            with db() as conn:
                conn.execute("INSERT INTO offers(id,name,audience,start_date,end_date,details,created_at,published,promo_code,service) VALUES(?,?,?,?,?,?,?,0,?,?)", (offer_id,name,audience,start,end,details,created,str((data or {}).get("promoCode", "")).strip()[:40],service))
            audit(actor["username"], "offer.create", offer_id, name)
            self._json({"ok": True, "offer": {"id":offer_id,"name":name,"audience":audience,"service":service,"start":start,"end":end,"details":details,"promoCode":str((data or {}).get("promoCode", "")).strip()[:40],"published":False,"createdAt":created}}, HTTPStatus.CREATED)
            return
        if path == "/api/admin/users":
            row, csrf = self._session()
            if not row:
                self._json({"ok": False, "error": "Staff sign-in required."}, HTTPStatus.UNAUTHORIZED); return
            if row["role"] != "admin":
                self._json({"ok": False, "error": "Only an administrator can manage accounts."}, HTTPStatus.FORBIDDEN); return
            if not hmac.compare_digest(self.headers.get("X-CSRF-Token", ""), csrf):
                self._json({"ok": False, "error": "Invalid session token."}, HTTPStatus.FORBIDDEN); return
            if not isinstance(data, dict):
                self._json({"ok": False, "error": "Expected account details."}, HTTPStatus.BAD_REQUEST); return
            username = str(data.get("username", "")).strip().lower()
            name = str(data.get("displayName", "")).strip()[:100]
            email = str(data.get("email", "")).strip()[:160]
            role = str(data.get("role", "staff")).lower()
            password = str(data.get("password", ""))
            if not re.fullmatch(r"[a-z0-9_-]{3,40}", username) or not name or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email) or role not in {"manager", "website_manager", "staff"} or len(password) < 12 or len(password) > 256:
                self._json({"ok": False, "error": "Use a 3–40 character username, name, valid email, staff/manager/website manager role and password of 12–256 characters."}, HTTPStatus.BAD_REQUEST); return
            try:
                with db() as conn:
                    conn.execute("INSERT INTO staff_users(username,display_name,email,role,password_hash,active,created_at) VALUES(?,?,?,?,?,1,?)",
                                 (username, name, email, role, password_hash(password), utc_now()))
                    created = conn.execute("SELECT * FROM staff_users WHERE username=?", (username,)).fetchone()
                audit(row["username"], "user.create", username, role)
                self._json({"ok": True, "user": safe_user(created)}, HTTPStatus.CREATED)
            except sqlite3.IntegrityError:
                self._json({"ok": False, "error": "That username already exists."}, HTTPStatus.CONFLICT)
            return
        if path == "/api/admin/feed":
            actor, csrf = self._session()
            if not actor:
                self._json({"ok": False, "error": "Staff sign-in required."}, HTTPStatus.UNAUTHORIZED); return
            if "content" not in ROLE_PERMISSIONS.get(actor["role"], set()):
                self._json({"ok": False, "error": "Your role cannot manage website stories."}, HTTPStatus.FORBIDDEN); return
            if not hmac.compare_digest(self.headers.get("X-CSRF-Token", ""), csrf):
                self._json({"ok": False, "error": "Invalid session token."}, HTTPStatus.FORBIDDEN); return
            action = str((data or {}).get("action", ""))
            try:
                with db() as conn:
                    row = conn.execute("SELECT draft_json,published_json FROM site_content WHERE id=1").fetchone()
                    draft = json.loads(row["draft_json"]) if row else {}
                    published = json.loads(row["published_json"]) if row else {}
                    live_posts = list(published.get("posts", []))
                    draft_posts = list(draft.get("posts", live_posts))
                    if action == "add":
                        post = clean_post((data or {}).get("post"))
                        if any(x.get("id") == post["id"] for x in live_posts):
                            post["id"] = "post-" + secrets.token_hex(8)
                        live_posts.insert(0, post)
                        draft_posts = [x for x in draft_posts if x.get("id") != post["id"]]
                        draft_posts.insert(0, post)
                        audit_action, target, detail = "feed.publish", post["id"], post["title"]
                    elif action == "update":
                        post = clean_post((data or {}).get("post"))
                        match = next((x for x in live_posts if x.get("id") == post["id"]), None)
                        if not match:
                            self._json({"ok": False, "error": "Published story not found."}, HTTPStatus.NOT_FOUND); return
                        post["createdAt"] = match.get("createdAt") or post["createdAt"]
                        live_posts = [post if x.get("id") == post["id"] else x for x in live_posts]
                        draft_posts = [post if x.get("id") == post["id"] else x for x in draft_posts]
                        if not any(x.get("id") == post["id"] for x in draft_posts): draft_posts.insert(0, post)
                        audit_action, target, detail = "feed.update", post["id"], post["title"]
                    elif action == "delete":
                        post_id = str((data or {}).get("id", ""))
                        match = next((x for x in live_posts if x.get("id") == post_id), None)
                        if not match:
                            self._json({"ok": False, "error": "Published story not found."}, HTTPStatus.NOT_FOUND); return
                        live_posts = [x for x in live_posts if x.get("id") != post_id]
                        draft_posts = [x for x in draft_posts if x.get("id") != post_id]
                        audit_action, target, detail = "feed.delete", post_id, str(match.get("title", ""))
                    else:
                        self._json({"ok": False, "error": "Choose add, update or delete."}, HTTPStatus.BAD_REQUEST); return
                    draft["posts"] = draft_posts
                    published["posts"] = live_posts
                    now = utc_now()
                    conn.execute("INSERT INTO site_content(id,draft_json,published_json,updated_at) VALUES(1,?,?,?) ON CONFLICT(id) DO UPDATE SET draft_json=excluded.draft_json,published_json=excluded.published_json,updated_at=excluded.updated_at", (json.dumps(draft, ensure_ascii=False), json.dumps(published, ensure_ascii=False), now))
                audit(actor["username"], audit_action, target, detail)
                self._json({"ok": True, "posts": live_posts, "updatedAt": now})
            except (ValueError, TypeError) as exc:
                self._json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if path == "/api/admin/content":
            row, csrf = self._session()
            if not row:
                self._json({"ok": False, "error": "Staff sign-in required."}, HTTPStatus.UNAUTHORIZED); return
            if "content" not in ROLE_PERMISSIONS.get(row["role"], set()):
                self._json({"ok": False, "error": "Your role cannot edit website content."}, HTTPStatus.FORBIDDEN); return
            if not hmac.compare_digest(self.headers.get("X-CSRF-Token", ""), csrf):
                self._json({"ok": False, "error": "Invalid session token."}, HTTPStatus.FORBIDDEN); return
            if not isinstance(data, dict):
                self._json({"ok": False, "error": "Expected content fields."}, HTTPStatus.BAD_REQUEST); return
            try:
                with db() as conn:
                    old = conn.execute("SELECT draft_json,published_json FROM site_content WHERE id=1").fetchone()
                    previous = json.loads(old["draft_json"]) if old else {}
                    published_previous = json.loads(old["published_json"]) if old else {}
                    content = {}
                    for key, limit in {"heroHeadline": 140, "heroCopy": 500, "storyImage": 500, "storyCaption": 180,
                                       "announcementHeadline": 140, "announcementCopy": 1000}.items():
                        content[key] = str(data.get(key, previous.get(key, "")))[:limit].strip()
                    if len(content["heroHeadline"].splitlines()) > 2:
                        raise ValueError("The opening headline can use up to two lines.")
                    if content["storyImage"] and not safe_media_url(content["storyImage"]):
                        raise ValueError("Page images must use HTTPS or an uploaded hotel image.")
                    for collection in CONTENT_SCHEMAS:
                        source_items = data.get(collection, previous.get(collection, []))
                        content[collection] = clean_collection(collection, source_items)
                    posts = data.get("posts", previous.get("posts", []))
                    if not isinstance(posts, list) or len(posts) > 30:
                        raise ValueError("The journal supports up to 30 stories.")
                    content["posts"] = [clean_post(post) for post in posts]
                    publish = data.get("publish") is True
                    now = utc_now()
                    published_json = json.dumps(content, ensure_ascii=False) if publish else json.dumps(published_previous, ensure_ascii=False)
                    conn.execute("INSERT INTO site_content(id,draft_json,published_json,updated_at) VALUES(1,?,?,?) ON CONFLICT(id) DO UPDATE SET draft_json=excluded.draft_json,published_json=excluded.published_json,updated_at=excluded.updated_at",
                                 (json.dumps(content, ensure_ascii=False), published_json, now))
                audit(row["username"], "content.publish" if publish else "content.save", "explore", f"{sum(len(content.get(k, [])) for k in CONTENT_SCHEMAS)} listings; {len(content['posts'])} stories")
                self._json({"ok": True, "content": content, "published": publish, "updatedAt": now})
            except (ValueError, TypeError) as exc:
                self._json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if path == "/api/admin/system":
            row, csrf = self._session()
            if not row:
                self._json({"ok": False, "error": "Staff sign-in required."}, HTTPStatus.UNAUTHORIZED); return
            if row["role"] != "admin":
                self._json({"ok": False, "error": "Only an administrator can change system settings."}, HTTPStatus.FORBIDDEN); return
            if not hmac.compare_digest(self.headers.get("X-CSRF-Token", ""), csrf):
                self._json({"ok": False, "error": "Invalid session token."}, HTTPStatus.FORBIDDEN); return
            days = (data or {}).get("retentionDays")
            audit_days = (data or {}).get("auditRetentionDays")
            allowed_request_days = {0, 90, 180, 365, 730, 1095}
            if (not isinstance(days, int) or isinstance(days, bool) or days not in allowed_request_days
                    or not isinstance(audit_days, int) or isinstance(audit_days, bool) or not 0 <= audit_days <= 3650):
                self._json({"ok": False, "error": "Choose an approved request retention period and an audit period from 0 to 3650 whole days."}, HTTPStatus.BAD_REQUEST); return
            with db() as conn:
                conn.execute("INSERT INTO app_settings(key,value,updated_at) VALUES('retention_days',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at", (str(days), utc_now()))
                conn.execute("INSERT INTO app_settings(key,value,updated_at) VALUES('audit_retention_days',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at", (str(audit_days), utc_now()))
            audit(row["username"], "settings.retention", "records", f"Requests={days or 'disabled'} days; audit={audit_days or 'disabled'} days")
            try:
                if retention_has_expired_records():
                    clear_backup_copies()
            except Exception as exc:
                self._json({"ok": False, "error": f"Retention purge paused because old backups could not be removed: {type(exc).__name__}."}, HTTPStatus.SERVICE_UNAVAILABLE); return
            removed = apply_retention()
            audit_removed = apply_audit_retention()
            if removed or audit_removed:
                audit("system", "retention.purge", "records", f"Removed {removed} expired requests and {audit_removed} expired audit events")
            try:
                create_backup()
            except Exception as exc:
                self._json({"ok": False, "error": f"Retention was saved, but the encrypted backup failed: {type(exc).__name__}."}, HTTPStatus.SERVICE_UNAVAILABLE); return
            self._json({"ok": True, "retentionDays": days, "auditRetentionDays": audit_days, "removed": removed, "auditRemoved": audit_removed})
            return
        if path == "/api/admin/backup":
            row, csrf = self._session()
            if not row:
                self._json({"ok": False, "error": "Staff sign-in required."}, HTTPStatus.UNAUTHORIZED); return
            if row["role"] != "admin":
                self._json({"ok": False, "error": "Only an administrator can create a backup."}, HTTPStatus.FORBIDDEN); return
            if not hmac.compare_digest(self.headers.get("X-CSRF-Token", ""), csrf):
                self._json({"ok": False, "error": "Invalid session token."}, HTTPStatus.FORBIDDEN); return
            try:
                target = create_backup()
            except Exception as exc:
                self._json({"ok": False, "error": f"Backup creation failed: {type(exc).__name__}."}, HTTPStatus.SERVICE_UNAVAILABLE); return
            audit(row["username"], "backup.create", target.name)
            self._json({"ok": True, "name": target.name, "size": target.stat().st_size}, HTTPStatus.CREATED)
            return
        if path == "/api/admin/cleanup":
            actor, csrf = self._session()
            if not actor:
                self._json({"ok": False, "error": "Staff sign-in required."}, HTTPStatus.UNAUTHORIZED); return
            if actor["role"] != "admin":
                self._json({"ok": False, "error": "Only an administrator can erase backups and audit history."}, HTTPStatus.FORBIDDEN); return
            if not hmac.compare_digest(self.headers.get("X-CSRF-Token", ""), csrf):
                self._json({"ok": False, "error": "Invalid session token."}, HTTPStatus.FORBIDDEN); return
            try:
                result = purge_all_backup_and_audit_records()
            except Exception as exc:
                self._json({"ok": False, "error": f"Full backup and audit purge failed: {type(exc).__name__}. Check server permissions and off-site backup access; retry to finish any remaining items."}, HTTPStatus.SERVICE_UNAVAILABLE); return
            self._json({"ok": True, **result})
            return
        if path == "/api/admin/media":
            row, csrf = self._session()
            if not row:
                self._json({"ok": False, "error": "Staff sign-in required."}, HTTPStatus.UNAUTHORIZED); return
            if "content" not in ROLE_PERMISSIONS.get(row["role"], set()):
                self._json({"ok": False, "error": "Your role cannot upload website media."}, HTTPStatus.FORBIDDEN); return
            if not hmac.compare_digest(self.headers.get("X-CSRF-Token", ""), csrf):
                self._json({"ok": False, "error": "Invalid session token."}, HTTPStatus.FORBIDDEN); return
            try:
                mime = str(data.get("mimeType", "")); raw = base64.b64decode(str(data.get("data", "")), validate=True)
                ext = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}[mime]
                signatures = {"jpg": raw.startswith(b"\xff\xd8\xff"), "png": raw.startswith(b"\x89PNG\r\n\x1a\n"), "webp": raw.startswith(b"RIFF") and raw[8:12] == b"WEBP"}
                if len(raw) > 6 * 1024 * 1024 or not signatures[ext]: raise ValueError()
            except (ValueError, KeyError, AttributeError, TypeError):
                self._json({"ok": False, "error": "Upload a JPEG, PNG or WebP image under 6 MB."}, HTTPStatus.BAD_REQUEST); return
            name = secrets.token_hex(16) + "." + ext
            (UPLOADS / name).write_bytes(raw)
            self._json({"ok": True, "url": "/uploads/" + name}, HTTPStatus.CREATED)
            return
        if path == "/api/admin/marketing/suppress":
            actor, csrf = self._session()
            if not actor:
                self._json({"ok": False, "error": "Staff sign-in required."}, HTTPStatus.UNAUTHORIZED); return
            if "marketing" not in ROLE_PERMISSIONS.get(actor["role"], set()):
                self._json({"ok": False, "error": "Your role does not allow managing promotional email preferences."}, HTTPStatus.FORBIDDEN); return
            if not hmac.compare_digest(self.headers.get("X-CSRF-Token", ""), csrf):
                self._json({"ok": False, "error": "Invalid session token."}, HTTPStatus.FORBIDDEN); return
            if not isinstance(data, dict):
                self._json({"ok": False, "error": "Enter a valid email address."}, HTTPStatus.BAD_REQUEST); return
            email = str(data.get("email", "")).strip().lower()
            action = str(data.get("action", ""))
            if len(email) > 254 or not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email) or action not in {"suppress", "restore"}:
                self._json({"ok": False, "error": "Enter a valid email address and choose an action."}, HTTPStatus.BAD_REQUEST); return
            if action == "suppress":
                now = utc_now()
                with db() as conn:
                    conn.execute(
                        """INSERT INTO marketing_suppressions(email,suppressed_at,suppressed_by) VALUES(?,?,?)
                           ON CONFLICT(email) DO UPDATE SET suppressed_at=excluded.suppressed_at,suppressed_by=excluded.suppressed_by""",
                        (email, now, actor["username"]),
                    )
                audit(actor["username"], "marketing.suppress", hashlib.sha256(email.encode("utf-8")).hexdigest()[:20], "Promotional email suppressed")
                self._json({"ok": True, "action": "suppressed"})
                return
            with db() as conn:
                suppression = conn.execute("SELECT suppressed_at FROM marketing_suppressions WHERE email=?", (email,)).fetchone()
                latest_opt_in = conn.execute(
                    "SELECT MAX(marketing_consent_at) AS opted_in_at FROM reservations WHERE lower(trim(guest_email))=? AND marketing_consent=1",
                    (email,),
                ).fetchone()
                if not suppression:
                    self._json({"ok": False, "error": "That address is not on the suppression list."}, HTTPStatus.CONFLICT); return
                if not latest_opt_in or not latest_opt_in["opted_in_at"] or latest_opt_in["opted_in_at"] <= suppression["suppressed_at"]:
                    self._json({"ok": False, "error": "The guest must submit a new enquiry and explicitly opt in before this address can be restored."}, HTTPStatus.CONFLICT); return
                conn.execute("DELETE FROM marketing_suppressions WHERE email=?", (email,))
            audit(actor["username"], "marketing.restore", hashlib.sha256(email.encode("utf-8")).hexdigest()[:20], "Address restored after a new opt-in")
            self._json({"ok": True, "action": "restored"})
            return
        if path == "/api/admin/logout":
            row, csrf = self._session()
            if not row:
                self._json({"ok": False, "error": "Staff sign-in required."}, HTTPStatus.UNAUTHORIZED); return
            if not hmac.compare_digest(self.headers.get("X-CSRF-Token", ""), csrf):
                self._json({"ok": False, "error": "Invalid session token."}, HTTPStatus.FORBIDDEN); return
            if not self._admin_required():
                return
            expired = session_cookie("", 0)
            self._json({"ok": True}, extra_headers={"Set-Cookie": expired})
            return
        self._json({"ok": False, "error": "Not found."}, HTTPStatus.NOT_FOUND)

    def do_PATCH(self):
        path = unquote(urlsplit(self.path).path)
        if path.startswith("/api/admin/users/"):
            actor, csrf = self._session()
            if not actor:
                self._json({"ok": False, "error": "Staff sign-in required."}, HTTPStatus.UNAUTHORIZED); return
            if actor["role"] != "admin":
                self._json({"ok": False, "error": "Only an administrator can manage accounts."}, HTTPStatus.FORBIDDEN); return
            if not hmac.compare_digest(self.headers.get("X-CSRF-Token", ""), csrf):
                self._json({"ok": False, "error": "Invalid session token."}, HTTPStatus.FORBIDDEN); return
            data = self._body_json()
            target = path[len("/api/admin/users/"):]
            if "/" in target or not re.fullmatch(r"[a-z0-9_-]{3,40}", target) or not isinstance(data, dict):
                self._json({"ok": False, "error": "Invalid account update."}, HTTPStatus.BAD_REQUEST); return
            if set(data) - {"role", "active", "displayName", "email"} or not data:
                self._json({"ok": False, "error": "Unsupported account fields."}, HTTPStatus.BAD_REQUEST); return
            with db() as conn:
                user = conn.execute("SELECT * FROM staff_users WHERE username=?", (target,)).fetchone()
                if not user:
                    self._json({"ok": False, "error": "Account not found."}, HTTPStatus.NOT_FOUND); return
                if user["role"] == "admin":
                    self._json({"ok": False, "error": "Administrator access is protected and cannot be changed here."}, HTTPStatus.FORBIDDEN); return
                if target == actor["username"] and data.get("active") is False:
                    self._json({"ok": False, "error": "You cannot deactivate your own account."}, HTTPStatus.BAD_REQUEST); return
                role = data.get("role", user["role"])
                active = data.get("active", bool(user["active"]))
                if not isinstance(role, str) or role not in {"manager", "website_manager", "staff"} or not isinstance(active, bool):
                    self._json({"ok": False, "error": "Choose staff, manager or website manager; active must be true or false."}, HTTPStatus.BAD_REQUEST); return
                display_name = user["display_name"]
                email = user["email"]
                changed = []
                if "displayName" in data:
                    if not isinstance(data["displayName"], str):
                        self._json({"ok": False, "error": "Enter a valid display name."}, HTTPStatus.BAD_REQUEST); return
                    display_name = data["displayName"].strip()
                    if not display_name or len(display_name) > 100:
                        self._json({"ok": False, "error": "Display name must be 1–100 characters."}, HTTPStatus.BAD_REQUEST); return
                    if display_name != user["display_name"]:
                        changed.append("display_name")
                if "email" in data:
                    if not isinstance(data["email"], str):
                        self._json({"ok": False, "error": "Enter a valid email address."}, HTTPStatus.BAD_REQUEST); return
                    email = data["email"].strip().lower()
                    if len(email) > 160 or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
                        self._json({"ok": False, "error": "Enter a valid email address (up to 160 characters)."}, HTTPStatus.BAD_REQUEST); return
                    duplicate = conn.execute("SELECT 1 FROM staff_users WHERE lower(email)=lower(?) AND username<>?", (email, target)).fetchone()
                    if duplicate:
                        self._json({"ok": False, "error": "That email address is already used by another account."}, HTTPStatus.CONFLICT); return
                    if email != user["email"].lower():
                        changed.append("email")
                if role != user["role"]:
                    changed.append("role")
                if bool(active) != bool(user["active"]):
                    changed.append("active")
                conn.execute("UPDATE staff_users SET display_name=?,email=?,role=?,active=?,updated_at=? WHERE username=?",
                             (display_name, email, role, int(active), utc_now(), target))
                updated = conn.execute("SELECT * FROM staff_users WHERE username=?", (target,)).fetchone()
            audit(actor["username"], "user.update", target, ",".join(changed) or "No account values changed")
            self._json({"ok": True, "user": safe_user(updated)}); return
        prefix = "/api/admin/reservations/"
        if not path.startswith(prefix):
            self._json({"ok": False, "error": "Not found."}, HTTPStatus.NOT_FOUND)
            return
        actor, csrf = self._session()
        if not actor:
            self._json({"ok": False, "error": "Staff sign-in required."}, HTTPStatus.UNAUTHORIZED)
            return
        if "reservations" not in ROLE_PERMISSIONS.get(actor["role"], set()):
            self._json({"ok": False, "error": "Your role cannot update reservations."}, HTTPStatus.FORBIDDEN); return
        supplied = self.headers.get("X-CSRF-Token", "")
        if not csrf or not hmac.compare_digest(supplied, csrf):
            self._json({"ok": False, "error": "Invalid session token. Please sign in again."}, HTTPStatus.FORBIDDEN)
            return
        data = self._body_json()
        parts = path[len(prefix):].strip("/").split("/")
        reference = parts[0]
        action = parts[1] if len(parts) > 1 else "status"
        updated = utc_now()
        if action == "amount":
            if actor["role"] != "admin":
                self._json({"ok": False, "error": "Only an administrator can change the amount due."}, HTTPStatus.FORBIDDEN); return
            with db() as conn:
                row = conn.execute("SELECT * FROM reservations WHERE reference=?", (reference,)).fetchone()
                if not row:
                    self._json({"ok": False, "error": "Request not found."}, HTTPStatus.NOT_FOUND); return
                amount_due = parse_money_minor((data or {}).get("amount"), row["currency"] or "UGX")
                if amount_due is None or amount_due <= 0:
                    self._json({"ok": False, "error": "Enter a valid positive amount in the request currency."}, HTTPStatus.BAD_REQUEST); return
                if amount_due < int(row["amount_paid_minor"] or 0):
                    self._json({"ok": False, "error": "The amount due cannot be lower than payments already recorded."}, HTTPStatus.CONFLICT); return
                new_status = "Paid" if amount_due == int(row["amount_paid_minor"] or 0) else ("Partially paid" if int(row["amount_paid_minor"] or 0) else "Awaiting payment")
                conn.execute("UPDATE reservations SET amount_due_minor=?,payment_status=?,updated_at=? WHERE reference=?", (amount_due, new_status, updated, reference))
                row = conn.execute("SELECT * FROM reservations WHERE reference=?", (reference,)).fetchone()
            audit(actor["username"], "reservation.amount_due", reference, f"amountMinor={amount_due}; currency={row['currency']}")
            self._json({"ok": True, "reservation": row_to_record(row)}); return
        status = str((data or {}).get("status", ""))
        if action != "status" or len(parts) != 1 or status not in VALID_STATUSES:
            self._json({"ok": False, "error": "Unsupported reservation update."}, HTTPStatus.BAD_REQUEST)
            return
        with db() as conn:
            row = conn.execute("SELECT * FROM reservations WHERE reference=?", (reference,)).fetchone()
            if not row:
                self._json({"ok": False, "error": "Request not found."}, HTTPStatus.NOT_FOUND); return
            if status == "Contacted" and not row["contacted_at"]:
                conn.execute("INSERT INTO contact_events(reservation_reference,contacted_at,contacted_by,method,note) VALUES(?,?,?,?,?)", (reference, updated, actor["username"], "other", "Staff marked this request as contacted."))
                conn.execute("UPDATE reservations SET status=?,contacted_at=?,contacted_by=?,contact_method=?,contact_note=?,updated_at=? WHERE reference=?", (status, updated, actor["username"], "other", "Staff marked this request as contacted.", updated, reference))
            else:
                conn.execute("UPDATE reservations SET status=?,updated_at=? WHERE reference=?", (status, updated, reference))
            row = conn.execute("SELECT * FROM reservations WHERE reference=?", (reference,)).fetchone()
        audit(actor["username"], "reservation.status", reference, status)
        self._json({"ok": True, "reservation": row_to_record(row)})

    def do_DELETE(self):
        path = unquote(urlsplit(self.path).path)
        if path.startswith("/api/admin/users/"):
            actor, csrf = self._session()
            if not actor:
                self._json({"ok": False, "error": "Staff sign-in required."}, HTTPStatus.UNAUTHORIZED); return
            if actor["role"] not in {"admin", "manager"}:
                self._json({"ok": False, "error": "Your role cannot delete staff accounts."}, HTTPStatus.FORBIDDEN); return
            if not hmac.compare_digest(self.headers.get("X-CSRF-Token", ""), csrf):
                self._json({"ok": False, "error": "Invalid session token."}, HTTPStatus.FORBIDDEN); return
            target = path[len("/api/admin/users/"):].strip("/")
            if not re.fullmatch(r"[a-z0-9_-]{3,40}", target):
                self._json({"ok": False, "error": "Invalid account."}, HTTPStatus.BAD_REQUEST); return
            with db() as conn:
                user = conn.execute("SELECT username,role FROM staff_users WHERE username=?", (target,)).fetchone()
                if not user:
                    self._json({"ok": False, "error": "Staff account not found."}, HTTPStatus.NOT_FOUND); return
                if user["role"] == "admin":
                    self._json({"ok": False, "error": "Administrator accounts are protected."}, HTTPStatus.FORBIDDEN); return
                if actor["role"] == "manager" and user["role"] != "staff":
                    self._json({"ok": False, "error": "Managers may delete staff accounts only."}, HTTPStatus.FORBIDDEN); return
                conn.execute("DELETE FROM staff_users WHERE username=?", (target,))
            audit(actor["username"], "user.delete", target, f"role={user['role']}")
            self._json({"ok": True, "username": target})
            return
        if not path.startswith("/api/admin/offers/"):
            self._json({"ok": False, "error": "Not found."}, HTTPStatus.NOT_FOUND); return
        actor, csrf = self._session()
        if not actor:
            self._json({"ok": False, "error": "Staff sign-in required."}, HTTPStatus.UNAUTHORIZED); return
        if "offers" not in ROLE_PERMISSIONS.get(actor["role"], set()):
            self._json({"ok": False, "error": "Your role cannot manage offers."}, HTTPStatus.FORBIDDEN); return
        if not hmac.compare_digest(self.headers.get("X-CSRF-Token", ""), csrf):
            self._json({"ok": False, "error": "Invalid session token."}, HTTPStatus.FORBIDDEN); return
        offer_id = path.rsplit("/", 1)[-1]
        with db() as conn:
            row = conn.execute("SELECT name FROM offers WHERE id=?", (offer_id,)).fetchone()
            if not row:
                self._json({"ok": False, "error": "Offer not found."}, HTTPStatus.NOT_FOUND); return
            conn.execute("DELETE FROM offers WHERE id=?", (offer_id,))
        audit(actor["username"], "offer.delete", offer_id, row["name"])
        self._json({"ok": True})


def main() -> None:
    validate_runtime()
    initialise_db()
    if PRODUCTION:
        with db() as conn:
            administrators = conn.execute("SELECT * FROM staff_users WHERE role='admin' AND active=1").fetchall()
            qualified = [row for row in administrators if row["username"].lower() != "admin" and "@" in row["email"] and not row["email"].lower().endswith((".test", ".example"))]
            if not qualified:
                raise SystemExit("Production startup blocked: provision a named administrator with a real hotel email and unique password before deployment.")
            qualified_usernames = {row["username"] for row in qualified}
            for row in administrators:
                if row["username"] not in qualified_usernames:
                    conn.execute("UPDATE staff_users SET active=0,auth_epoch=auth_epoch+1,updated_at=? WHERE username=?", (utc_now(), row["username"]))
                    conn.execute("INSERT INTO audit_log(created_at,actor,action,target,detail) VALUES(?,?,?,?,?)", (utc_now(), "system", "user.disable", row["username"], "Disabled an administrator account without a production identity."))
    create_backup()
    import threading
    threading.Thread(target=maintenance_loop, daemon=True, name="ginnery-maintenance").start()
    server = ThreadingHTTPServer((HOST, PORT), GinneryHandler)
    print(f"The Ginnery {'production' if PRODUCTION else 'local'} server is listening on {HOST}:{PORT}")
    print("Press Ctrl+C to stop the server.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping The Ginnery server...")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()

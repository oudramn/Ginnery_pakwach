"""Create the application artifact consumed by the AWS Terraform stack."""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = Path(__file__).resolve().parent / "release.zip"
FILES = (
    "app.py", "requirements.txt", "index.html", "explore.html", "explore.css", "explore.js",
    "booking.html", "booking-extras.js", "admin.html", "admin-extras.js",
    "ginnery-polish.css", "fx.css", "fx.js", "ginnery-logo.png", "ginnery-favicon.png",
)


def main() -> None:
    with ZipFile(OUTPUT, "w", ZIP_DEFLATED) as archive:
        for name in FILES:
            source = ROOT / name
            if not source.is_file():
                raise SystemExit(f"Release file is missing: {name}")
            archive.write(source, arcname=name)
    print(f"Created {OUTPUT} ({OUTPUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()

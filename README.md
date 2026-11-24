# The Ginnery — Hotel Website

This folder contains The Ginnery guest website, Explore page, enquiry flow, and authenticated staff portal. The home page keeps its approved cinematic design; changing hotel content is managed from Explore and the staff portal.

## Run locally

On Windows, double-click `preview-windows.bat`, or open PowerShell in this folder and run:

```powershell
python app.py
```

Then open:

- Guest website: `http://127.0.0.1:8000/`
- Explore: `http://127.0.0.1:8000/explore.html`
- Staff portal: `http://127.0.0.1:8000/admin.html`

The launcher uses the existing server-side SQLite database in `instance/ginnery.sqlite3` and does not set a shared password. Sign in with an account already configured for this installation. If the database has no administrator, startup generates a one-time credential file at `instance/initial-admin-credentials.txt`; secure that file and remove it after signing in and changing the password.

## Site and staff features

- The home page links to Explore, booking enquiries, dining and events.
- Explore presents hotel-managed rooms and rates, menu items, events, activities, team profiles, photography and journal posts. Published content is served from the database and refreshed by the guest page.
- Administrators and authorized website managers can add, edit, publish and remove Explore content and feed stories, including uploaded photos, without editing code.
- Staff, managers, website managers and administrators have separate permissions. Only administrators can create accounts, change roles, issue a temporary password, change amounts due, and access security and backup settings.
- Staff can log customer contact actions. Administrators and managers can record payments actually received, including partial payments and transaction notes. Reports distinguish enquiries, contacted customers, confirmed workflow records and manually recorded collections.
- Paddle court and mini-golf requests are supported in the enquiry flow. They are requests for the hotel to confirm, not instant availability or confirmed bookings.
- Manual and scheduled database backups, audit records and configurable retention are available from the authenticated staff portal.

Passwords are stored as PBKDF2 hashes. Staff sessions use signed HTTP-only cookies with CSRF checks and login rate limits. Do not share credentials or use real guest data on an unreviewed local machine.

## Hosting status

AWS deployment files are prepared under `infra/aws/`; they have **not** been applied to the hotel's AWS account or connected to the existing domain. Create and review the release archive with:

```powershell
python infra/aws/package_release.py
```

The Terraform configuration prepares an HTTPS front end, a single application host, and private versioned S3 backups encrypted with KMS. Hosting still requires AWS credentials, the confirmed domain and DNS access, secret provisioning, a reviewed cost and security plan, and a restore check. A local server is available only at `127.0.0.1` and is not publicly hosted.

Payments were deferred. Manual payment records in the staff portal are bookkeeping entries only; they do not charge a card or verify settlement. Stripe is not enabled. PMS or booking-engine synchronization is also not enabled because a provider was not selected. The current site saves enquiries and cannot check live room, court or golf availability, prevent conflicts against hotel inventory, send guest email/WhatsApp, or guarantee a reservation.

Before using the hosted system with guests, the hotel must approve its address, property photos, menu, room and activity rates, policies, privacy/retention rules, payment provider, and booking-system integration. The current AWS baseline is a single-host enquiry application, not a completed production security review or a live reservation engine.

## Project files

- `index.html` — hotel home page.
- `explore.html`, `explore.css`, `explore.js` — guest-facing Explore page.
- `booking.html`, `booking-extras.js` — guest enquiry and activity request flows.
- `admin.html`, `admin-extras.js` — authenticated staff portal and content editors.
- `app.py` — HTTP application, SQLite persistence, authentication and API authorization.
- `infra/aws/` — AWS deployment configuration and release packaging.

# Gigspot Admin

The staff web panel for Gigspot. It replaces the Django admin and the mobile app's old admin screens and talks only to
the `/api/admin/*` endpoints of [Gigspot-api](../Gigspot-api); it holds no data
and no secrets of its own.

Built with React 19, [Refine](https://refine.dev) 5 and Ant Design 5, on Vite.

## What's in it

| Screen | Needs | What staff can do |
| --- | --- | --- |
| Dashboard | `dashboard.view` | Users, bookings and money for 7/30/90 days; work queues (identity checks, documents, open disputes, held payouts, withdrawals and refunds to settle, review reports) |
| Users | `users.view` | Search and filter; edit details, suspend or reactivate, change role, approve or reject identity checks, review documents; close an account for good (super admin: personal details wiped, bookings and payments kept) |
| Bookings | `bookings.view` | Search and filter; cancel (optionally reopening the gig), mark done, hold, lift or release a payout; payments, proof of work, review, and messages (opening messages is audited) |
| Disputes | `disputes.view` | Start review, resolve (refund the client, pay the professional, split, or no money moves), close without outcome |
| Professionals | `professionals.view` | Filter by category, city, listing and verification; list, feature or mark unavailable; hide or show a service; approve or reject certificates; remove portfolio items; recompute rating and earnings |
| Gigs and jobs | `postings.view` | Filter by kind, status and category; see quotes; edit a posting's wording (e.g. remove phone numbers); close an open posting, declining its pending quotes |
| Categories | `professionals.view` | Add, edit, hide categories (`categories.manage`); delete only one nothing uses |
| Money: transactions | `payments.view` | Filter by type, status or stuck refunds; re-check a pending payment with Flutterwave; retry a stuck refund (after checking Flutterwave) or settle it by hand |
| Money: withdrawals | `payments.view` | Mark paid, reject, retry or refresh the Flutterwave transfer; a transfer that never confirmed needs an explicit "I checked Flutterwave" |
| Money: wallets | `payments.view` | A professional's balance, manual adjustments (credit or debit, with reason) and recent withdrawals |
| Money: reconciliation | `payments.view` | Our completed payments against Flutterwave's for up to 31 days, listing every difference |
| Subscriptions | `subscriptions.view` | Subscribers, complimentary grants and revokes, Google Play re-check; plan names, shown prices and availability |
| Reviews | `reviews.view` | Hide or unhide reviews; settle reports (resolve, optionally hiding the review, or dismiss) |
| Notifications | `notifications.view` | Send to one person or a group (counted first, then confirmed), start from a template, sending history, templates |
| Staff | `staff.manage` | Give and take staff roles, reset an authenticator; enrolment codes are shown once |
| App | `telemetry.view` | Crash-free sessions and people per version, crashes grouped by code location (people affected, phones, steps before, stack; mark fixed or ignored), phones and old versions, usage and features, sign-in times and failures, slow screens and API calls by network, one person's app activity (opening it is audited) |
| Report | `dashboard.view` | The platform report (people, professionals, bookings, money, subscriptions) to print or save as PDF |
| Audit log | `audit.view` | Every staff action with its reason and changes, filterable, linked from user, booking and dispute pages |

Lists that have one carry an **Export CSV** button (`exports.download`) that
exports what is on screen with the same filters and sort, up to 10,000 rows.
Each export is recorded in the audit log.

Buttons the signed-in person's roles don't allow are hidden, and the API checks
every permission again. Actions on accounts, money and content ask for a
reason, which goes into the audit log with the change itself (template edits
and provider re-checks are logged without one).

## Signing in

Staff sign in with their Gigspot email and password, then a code from an
authenticator app (TOTP). Everyone has to set one up the first time:

1. A super admin creates an enrolment code for the person (in the panel later,
   or now with `node dist/cli.js staff-invite <email>` in Gigspot-api).
2. The person signs in, enters the enrolment code, scans the QR code with their
   authenticator app and types the six-digit code it shows.

The session lasts 8 hours by default and lives in `sessionStorage`, so closing
the tab signs you out.

## Running it locally

You need Gigspot-api running on port 8000 (`npm run start:dev` there).

```bash
npm install
```

```bash
npm run dev
```

The panel is at http://localhost:5174. Vite forwards `/api` and `/media` to the
API; point it elsewhere with `GIGSPOT_API=http://host:port`.

For demo data, run `npx ts-node scripts/dev-seed.ts` in Gigspot-api. It only
runs with `DEBUG` on against a localhost database, creates a super admin, people,
bookings, a dispute, withdrawals, a stuck refund, a reported review, a
complimentary plan and a template, and writes the staff password to
`Gigspot-api/.dev-credentials.txt` (gitignored). Run against a database it
already seeded, it adds only the money and content parts if they are missing.

## Building

```bash
npm run build
```

Set `VITE_API_URL` (see `.env.example`) to the API's public `/api` URL at build
time, e.g. `https://api.gigspot.example/api`. The output in `dist/` is static
files: serve them from any static host (a Railway static service works) with
every unknown path falling back to `index.html`.

Host the panel on **its own domain**, not under the API's: people's uploaded
files are served from the API's domain, and the panel's session should never
share an origin with them. Then list the panel's address in the API's
`ADMIN_PANEL_ORIGINS` (e.g. `https://admin.gigspot.example`); the API refuses
browser calls to `/api/admin` from anywhere else.

Recommended response headers from the static host:

```
Content-Security-Policy: default-src 'self'; connect-src 'self' https://api.gigspot.example; img-src 'self' data: https://api.gigspot.example; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000
```

Keep the address unlisted and add `noindex` (already in `index.html`).

## Checks

```bash
npm run typecheck
```

### End-to-end tests

The key admin flows run in a real browser against a real API:

- first sign-in with an enrolment code and an authenticator code
- marking a withdrawal paid from the dashboard queue, and refusing an
  unconfirmed Flutterwave transfer until it was checked
- holding and lifting a payout, resolving a review report, editing a posting,
  adding and deleting a category, sending a group notification
- finding every one of those in the audit log with its reason, signing out
- a read-only viewer seeing records but no actions, masked account numbers and
  no staff screens

They need Gigspot-api next to this folder and its database running
(`npm run db` there). They build the API into `Gigspot-api/.e2e-dist`, use a
separate `gigspot_e2e` database that they empty and seed each run (the dev
database is never touched), and start the API on port 8100 and the panel on
5175. They use the Microsoft Edge installed on Windows; set
`E2E_BROWSER_CHANNEL=chrome` for Chrome, or empty for Playwright's own
Chromium (`npx playwright install chromium`).

```bash
npm run test:e2e
```

## Layout

```
src/
  api.ts            fetch wrapper: admin envelope, errors, CSV downloads
  session.ts        token storage
  providers.ts      Refine data, auth and access-control providers
  resources.tsx     the side menu
  components/       ActionButton (confirm + reason + audit), detail page helpers, CSV export,
                    permission-aware links, Header, formatting, table hook
  pages/            dashboard, login, users, bookings, disputes, professionals, postings,
                    categories, payments, subscriptions, reviews, notifications, staff
e2e/                end-to-end tests and the script that starts their API
```

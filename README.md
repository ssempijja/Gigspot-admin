# Gigspot Admin

The staff web panel for Gigspot. It replaces the Django admin and talks only to
the `/api/admin/*` endpoints of [Gigspot-api](../Gigspot-api); it holds no data
and no secrets of its own.

Built with React 19, [Refine](https://refine.dev) 5 and Ant Design 5, on Vite.

## What's in it

| Screen | Needs | What staff can do |
| --- | --- | --- |
| Dashboard | `dashboard.view` | Users, bookings and money for 7/30/90 days; work queues (identity checks, documents, open disputes, held payouts, withdrawals and refunds to settle, review reports) |
| Users | `users.view` | Search and filter; edit details, suspend or reactivate, change role, approve or reject identity checks, review documents |
| Bookings | `bookings.view` | Search and filter; cancel (optionally reopening the gig), mark done, hold, lift or release a payout; payments, proof of work, review, and messages (opening messages is audited) |
| Disputes | `disputes.view` | Start review, resolve (refund the client, pay the professional, split, or no money moves), close without outcome |
| Money: transactions | `payments.view` | Filter by type, status or stuck refunds; re-check a pending payment with Flutterwave; retry a stuck refund (after checking Flutterwave) or settle it by hand |
| Money: withdrawals | `payments.view` | Mark paid, reject, retry or refresh the Flutterwave transfer; a transfer that never confirmed needs an explicit "I checked Flutterwave" |
| Money: wallets | `payments.view` | A professional's balance, manual adjustments (credit or debit, with reason) and recent withdrawals |
| Money: reconciliation | `payments.view` | Our completed payments against Flutterwave's for up to 31 days, listing every difference |
| Subscriptions | `subscriptions.view` | Subscribers, complimentary grants and revokes, Google Play re-check; plan names, shown prices and availability |
| Reviews | `reviews.view` | Hide or unhide reviews; settle reports (resolve, optionally hiding the review, or dismiss) |
| Notifications | `notifications.view` | Send to one person or a group (counted first, then confirmed), start from a template, sending history, templates |
| Staff | `staff.manage` | Give and take staff roles, reset an authenticator; enrolment codes are shown once |
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
time. The output in `dist/` is static files: serve them from any static host
with every unknown path falling back to `index.html`. Gigspot-api has no CORS
set up yet, so for now serve the panel from the same origin as the API (proxy
`/api` and `/media` to it) and leave `VITE_API_URL` at `/api`; a CORS allow-list
for a separate panel domain is part of the hardening phase.

## Checks

```bash
npm run typecheck
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
  pages/            dashboard, login, users, bookings, disputes, payments, subscriptions,
                    reviews, notifications, staff
```

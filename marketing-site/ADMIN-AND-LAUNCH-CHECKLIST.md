# Admin Dashboard and Production Readiness

## Implemented in the feature branch
- Admin control centre with overview, website settings, services management, and enquiries navigation.
- Authenticated CMS API to save bilingual homepage title/intro, phone, email, location, and service entries to MongoDB.
- Public website reads published CMS settings and service catalogue; existing bilingual services are seeded on first database startup.
- Service add/edit/delete and publish/hide controls; CSV export for the currently loaded enquiry set.
- Admin CMS edits do not touch ERP data, invoices, invoice PDFs, or Firebase rules.

## Still not implemented in this CMS pass
- Image/file uploads, arbitrary page builder, FAQs/testimonials editor, admin roles/MFA, audit trail, lead notes/follow-up reminders.
- Full browser-based end-to-end CMS save/publish verification against the live deployment.
- Private admin sign-in using deployment-provided email/password and a signed, HTTP-only session cookie.
- Enquiry dashboard with status filtering, refresh, contact details and status updates.
- Admin API endpoints deny access unless a valid signed session is present.
- Login rate limiting, schema validation, same-site cookie protection, security headers and deployment-configurable secure cookies.
- No public lead-list or lead-update endpoint; dashboard is available at `/admin`.

## Deployment variables required for admin access
Set these in the API service's secret environment configuration before using `/admin`:
- `ADMIN_EMAIL`: dedicated company admin email.
- `ADMIN_PASSWORD`: long, unique password; do not reuse an email or other account password.
- `SESSION_SECRET`: cryptographically random secret of at least 32 characters.
- `CLIENT_ORIGIN`: exact deployed frontend origin, comma-separated if more than one is needed.
- `NODE_ENV=production` in production so session cookies are Secure.
The admin interface remains inaccessible until required credentials are configured. Use a password manager and rotate credentials if exposed. This initial dashboard is single-admin credential based; add a company identity provider and MFA before broad staff rollout.

## Still needs company/account-owner input
- MongoDB Atlas connection and production database permissions/backups.
- Company-branded domain ownership, DNS and HTTPS.
- Approved Google Ads/Analytics account IDs and conversion events.
- Management approval of English/Arabic copy, service scope and contact details before campaigns/public launch.
- Privacy notice and retention policy approved for the company's jurisdiction.

## Launch checklist
- [ ] Approve English and Arabic content and native Arabic proofreading.
- [ ] Approve service catalogue, claims, offers, FAQs and testimonials.
- [ ] Confirm legal entity name, address, phone, email, WhatsApp number and working hours.
- [ ] Provision production MongoDB with least-privilege credentials, backups, retention and restore drill.
- [ ] Set API environment secrets and verify secure admin sign-in/session expiry/denial paths.
- [ ] Test lead submission and persistence after MongoDB is configured.
- [ ] Test mobile, RTL, keyboard accessibility and broken links.
- [ ] Add approved Google Ads/Analytics IDs and verify real conversion events and deduplication.
- [ ] Run dependency/security scans and production build; test staging before DNS switch.
- [ ] Confirm no files outside `marketing-site/` are changed by this branch and ERP invoice regression checks remain green.

# SEO, mobile QA and Google Ads conversion launch

This checklist is for the standalone public marketing website only. Do not edit the ERP repository, accounting data, invoice templates, invoice/PDF output, or Firebase rules.

## Completed in this branch
- Expanded page title, meta description, Open Graph and Twitter card metadata.
- Added resource preconnect for the existing hero image host.
- Improved keyboard focus visibility and mobile touch targets for navigation and lead-form controls.
- Added small-screen layout safeguards for widths down to 320px.

## Must be completed before indexing/campaign launch
1. **Choose and connect the company-branded domain.** Do not add a canonical URL, final sitemap URL, or Google Search Console property until the actual domain is confirmed. Keep the Render URL as a staging/live fallback, not the final brand URL.
2. **Approve factual company content.** The four current service cards are draft categories based on the ERP workflow, not a verified public service catalogue. Management must approve the exact English and Arabic service names/descriptions, legal business name, location/address, operating hours, phone/WhatsApp and email. Native Arabic proofreading is required.
3. **Complete mobile QA.** Test 320px, 360px, 390px, 768px and desktop widths; English and Arabic RTL; menu open/close; form validation; keyboard focus; no horizontal overflow; successful enquiry submission; and real WhatsApp/call links.
4. **Configure SEO after domain approval.** Add canonical URL, robots.txt, XML sitemap, Organization/LocalBusiness structured data with only verified facts, Search Console verification and sitemap submission. Do not invent an exact address, ratings, reviews, guarantees, or government affiliations.
5. **Configure analytics and Ads with the account owner.** Add approved GA4 Measurement ID (G-...) and Google Ads ID (AW-...) through the deployment build environment only after the account owner provides them. Never commit API secrets.
6. **Consent and event plan.** Respect the approved privacy notice and consent requirements for the jurisdictions targeted. Track only meaningful actions: successful enquiry submission (after API returns success), click-to-WhatsApp, and click-to-call. Do not count button clicks as completed leads; avoid sending names, phone numbers, messages, passport details or other personal data to analytics. Deduplicate form conversions and test with Tag Assistant / GA4 DebugView before enabling campaigns.
7. **Ads launch controls.** Link the correct Google Ads and Analytics properties, set conversion actions and attribution settings, add campaign landing page and UTMs, verify billing/account access, and keep campaigns paused until conversions are confirmed end-to-end.

## Required company/account-owner inputs
- Final company-branded domain and DNS access.
- Approved service catalogue and English/Arabic copy.
- Confirmation that the contact details in client/src/content.ts are current and approved for publication.
- Google Analytics 4 Measurement ID, Google Ads Conversion ID and conversion action label(s), or access to the relevant accounts so they can be configured directly.
- Approved privacy notice/consent wording and retention policy.
- Confirmation of campaign target geography, languages and landing-page offer.

## Validation record
Do not mark the website launch-ready solely because the Vite build passes. Browser/mobile QA, live form persistence, real account conversion tests, domain/DNS, and privacy review must each be verified separately.

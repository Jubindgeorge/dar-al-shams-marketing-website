# Dar Al Shams Marketing Website

Standalone public marketing website for Dar Al Shams. The application is isolated in `marketing-site/` and does not change the ERP repository, Firebase rules/data, accounting, invoices, or PDF output.

- Frontend root: `marketing-site/client` (React + TypeScript + Vite)
- API root: `marketing-site/server` (Express + MongoDB)
- Languages: English and Arabic (RTL)

See `marketing-site/README.md` and `marketing-site/ADMIN-AND-LAUNCH-CHECKLIST.md`. Production enquiries require MongoDB configuration. Admin lead-management routes are intentionally not enabled until secure authentication and role checks are implemented. Verify company contact details and service claims before advertising.
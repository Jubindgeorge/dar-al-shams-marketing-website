# Admin session cookie fix: same-origin deployment

## What this changes

- The API service can serve the existing React client from `marketing-site/client/dist`.
- The admin app redirects from the legacy static-site `/admin` URL to the API service's `/admin` URL when the client build was configured with `VITE_API_BASE_URL`.
- The API's admin session cookie uses `SameSite=Lax`; the admin UI and protected API requests then share the API origin and no longer depend on third-party cookies.
- The existing static public website can remain in place for now, so public enquiry forms continue to use its configured API base URL.
- No admin credentials, MongoDB collections/documents, enquiry data, or ERP/accounting/invoice files are changed by this patch.

## Required Render configuration before deployment

For the Render web service `dar-al-shams-marketing-api` (service ID `srv-dbci3qui0phs73a5mpf0`):

1. Keep the repository root directory blank.
2. Change the **Build Command** to:

   ```sh
   cd marketing-site/client && npm install --no-audit --no-fund && npm run build && cd ../server && npm install --no-audit --no-fund && npm run build
   ```

3. Keep the **Start Command** as:

   ```sh
   cd marketing-site/server && npm start
   ```

4. Ensure the API service's client build does not have `VITE_API_BASE_URL` set to the API's own absolute URL. For this build, leave it unset/blank so admin requests are relative and same-origin.
5. Keep the static website service's `VITE_API_BASE_URL` set to `https://dar-al-shams-marketing-api.onrender.com`, so the existing public website continues to submit enquiries to the API.
6. Keep existing `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET`, MongoDB, and CORS environment values unchanged.

## Safe rollout and verification

Do not merge/deploy until the branch build passes and the Render API service's build command is updated. After deploy:

1. Open `https://dar-al-shams-marketing-api.onrender.com/admin` directly.
2. In a fresh browser profile with third-party cookies blocked, sign in using the existing admin credentials.
3. Verify session persists after refresh; open Website Settings, Services, and Enquiries; sign out and verify the session is cleared.
4. Open `https://dar-al-shams-marketing-website.onrender.com/admin` and verify it redirects to the API-hosted admin portal.
5. Submit a controlled test enquiry through the public website and verify it appears in the admin enquiries list. Remove the test enquiry only if the product has an approved deletion process; do not alter existing customer data.

The source branch alone cannot confirm browser behavior or Render environment configuration. These checks must be run after a preview/deployment, with third-party cookies disabled.

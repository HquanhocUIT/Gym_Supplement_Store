# Google sign-in and product photos setup

## Google sign-in

1. In Google Cloud Console, create an OAuth client with application type **Web application**. Add these authorized JavaScript origins:
   - `https://www.gymbro.click`
   - `https://gymbro.click`
   - `http://localhost:5173` for local development
2. Copy the OAuth **Client ID**. Do not create or paste a client secret; this Google Identity Services flow uses the ID token.
3. Apply `database/migrations/04_google_sign_in.sql` to the PostgreSQL database used by the deployed API before deploying the backend. The migration adds the Google subject column and its unique index.
4. Set `GOOGLE_CLIENT_ID` in Render for `gym-store-api` to that client ID, then deploy the backend.
5. Set `VITE_GOOGLE_CLIENT_ID` in Vercel for the `gym-supplement-store` project to the same client ID. This is a browser-visible identifier, so keep it as a Config value rather than treating it as a secret. Redeploy the frontend after saving it.

The login page shows Google's official sign-in button when `VITE_GOOGLE_CLIENT_ID` is configured. The backend verifies each ID token and only creates or links member accounts. Verified Google email addresses can link to existing member accounts; staff and admin accounts must continue using password sign-in. If the OAuth consent screen is in Testing mode, add your Google account as a test user.

Google's setup and token verification references: [Google Identity Services backend authentication](https://developers.google.com/identity/sign-in/web/backend-auth) and [verify Google ID tokens](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).

## Product photos

The admin product editor already supports uploading and replacing product photos. The API stores them in Supabase Storage and returns a public image URL. In Supabase, create a **public** Storage bucket named `product-images`. Then set these values in Render under `gym-store-api` → **Environment**:

- `SUPABASE_URL`: the Supabase project URL
- `SUPABASE_SECRET_KEY`: a server-side Supabase secret key; never put it in Vercel or frontend files
- `SUPABASE_STORAGE_BUCKET`: `product-images`

Save and redeploy the Render service. In the website admin, open **Products**, select **Choose a new photo** for a product, then click **Upload photo** or **Replace photo**. Supported formats are JPEG, PNG and WebP, up to 5 MB.

# Google Cloud administrator service

The public Astro site remains on GitHub Pages for the first release. Private editing data is separated into a Google Cloud administrator API. Production currently uses a second-generation Cloud Function; the same source can also run in Cloud Run:

- Firestore: cross-device drafts and optimistic revision checks.
- Cloud Storage private bucket: unpublished images and short-lived previews.
- Cloud Storage public bucket: fingerprinted images that have been published.
- Secret Manager: GitHub App credentials and the administrator session key.
- GitHub App: verifies `String020` and commits only the published content file.

No Google Cloud or GitHub secret is included in the browser bundle or repository.

## One-time resources

Use project `string-portal-admin` and region `asia-southeast1`. Firestore location cannot be changed later, so confirm it before running the database creation command.

```powershell
gcloud config set project string-portal-admin
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com firestore.googleapis.com storage.googleapis.com secretmanager.googleapis.com iamcredentials.googleapis.com
gcloud artifacts repositories create portal --repository-format=docker --location=asia-southeast1
gcloud firestore databases create --location=asia-southeast1 --type=firestore-native
gcloud storage buckets create gs://string-portal-admin-drafts --location=asia-southeast1 --uniform-bucket-level-access
gcloud storage buckets create gs://string-portal-admin-public --location=asia-southeast1 --uniform-bucket-level-access
gcloud storage buckets add-iam-policy-binding gs://string-portal-admin-public --member=allUsers --role=roles/storage.objectViewer
gcloud iam service-accounts create string-portal-admin --display-name="String portal administrator"
```

Grant the runtime account only the services it uses:

```powershell
gcloud projects add-iam-policy-binding string-portal-admin --member="serviceAccount:string-portal-admin@string-portal-admin.iam.gserviceaccount.com" --role="roles/datastore.user"
gcloud projects add-iam-policy-binding string-portal-admin --member="serviceAccount:string-portal-admin@string-portal-admin.iam.gserviceaccount.com" --role="roles/storage.objectAdmin"
gcloud projects add-iam-policy-binding string-portal-admin --member="serviceAccount:string-portal-admin@string-portal-admin.iam.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
gcloud iam service-accounts add-iam-policy-binding string-portal-admin@string-portal-admin.iam.gserviceaccount.com --member="serviceAccount:string-portal-admin@string-portal-admin.iam.gserviceaccount.com" --role="roles/iam.serviceAccountTokenCreator"
```

## GitHub App

Create a private GitHub App owned by `String020` and install it only on `String020/String020.github.io`.

- Repository permission: Contents — Read and write.
- User authorization callback URL: the deployed API URL plus `/auth/github/callback`.
- Keep webhook disabled for this first version.
- Record the App ID, Client ID, Client secret, installation ID, and generated private key.

Create these Secret Manager secrets and add their values as version `latest`:

```text
github-app-id
github-client-id
github-client-secret
github-installation-id
github-private-key
session-secret
```

Use at least 32 random bytes for `session-secret`. Do not paste any of these values into `.env.example`, a commit, or a GitHub Actions variable.

## Build and deploy

From `admin-api/`:

```powershell
gcloud builds submit --config cloudbuild.yaml .
```

After Google Cloud returns the public function URL:

1. Update the GitHub App callback URL.
2. Add repository variable `PUBLIC_ADMIN_API_URL` with the function origin, without a trailing slash.
3. Trigger the GitHub Pages workflow once.
4. Open `/admin/`, sign in as `String020`, and publish a small test change.

The API entry is intentionally public so OAuth can be reached, but every `/v1/*` operation requires a short-lived signed administrator token and the server allows only the configured site origins.

## Later migration away from GitHub Pages

The frontend is a static Astro build, so it can be moved to Cloud Storage, Firebase Hosting, or Cloud Run. The repository can then be made private. Change `SITE_URL`, `ALLOWED_ORIGINS`, the GitHub App callback, and `PUBLIC_ADMIN_API_URL`; the content model and editor do not need to be rebuilt.

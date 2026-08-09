# Google Cloud Run setup

This repository includes a GitHub Actions workflow at `/home/runner/work/skills/skills/.github/workflows/deploy-cloud-run.yml` that can authenticate to Google Cloud with Workload Identity Federation and deploy to Cloud Run.

## 1. Create or choose a Google Cloud project

Set the project values you will reuse:

```bash
export PROJECT_ID="your-project-id"
export PROJECT_NUMBER="$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')"
export REGION="us-central1"
export REPO_OWNER="muneerah83"
export REPO_NAME="skills"
export SERVICE_NAME="your-cloud-run-service"
```

Enable the required APIs:

```bash
gcloud services enable \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  iam.googleapis.com \
  run.googleapis.com \
  sts.googleapis.com \
  iamcredentials.googleapis.com \
  --project "${PROJECT_ID}"
```

## 2. Create the deployment service account

```bash
export SERVICE_ACCOUNT_NAME="github-cloud-run-deployer"
export SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud iam service-accounts create "${SERVICE_ACCOUNT_NAME}" \
  --project "${PROJECT_ID}" \
  --display-name "GitHub Cloud Run Deployer"
```

Grant the minimum roles needed for Cloud Run source deployments:

```bash
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member "serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role "roles/run.admin"

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member "serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role "roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member "serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role "roles/cloudbuild.builds.editor"

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member "serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role "roles/iam.serviceAccountUser"
```

If you use a runtime service account for the Cloud Run service, also allow the deployer to act as that account.

## 3. Configure Workload Identity Federation for GitHub Actions

Create a workload identity pool and provider:

```bash
export WORKLOAD_IDENTITY_POOL="github-actions"
export WORKLOAD_IDENTITY_PROVIDER_ID="skills-repo"

gcloud iam workload-identity-pools create "${WORKLOAD_IDENTITY_POOL}" \
  --project "${PROJECT_ID}" \
  --location "global" \
  --display-name "GitHub Actions"

gcloud iam workload-identity-pools providers create-oidc "${WORKLOAD_IDENTITY_PROVIDER_ID}" \
  --project "${PROJECT_ID}" \
  --location "global" \
  --workload-identity-pool "${WORKLOAD_IDENTITY_POOL}" \
  --display-name "GitHub skills repository" \
  --issuer-uri "https://token.actions.githubusercontent.com" \
  --attribute-mapping "google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
  --attribute-condition "assertion.repository=='${REPO_OWNER}/${REPO_NAME}'"
```

Allow the GitHub repository to impersonate the deployer account:

```bash
gcloud iam service-accounts add-iam-policy-binding "${SERVICE_ACCOUNT_EMAIL}" \
  --project "${PROJECT_ID}" \
  --role "roles/iam.workloadIdentityUser" \
  --member "principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${WORKLOAD_IDENTITY_POOL}/attribute.repository/${REPO_OWNER}/${REPO_NAME}"
```

Get the provider resource name:

```bash
gcloud iam workload-identity-pools providers describe "${WORKLOAD_IDENTITY_PROVIDER_ID}" \
  --project "${PROJECT_ID}" \
  --location "global" \
  --workload-identity-pool "${WORKLOAD_IDENTITY_POOL}" \
  --format='value(name)'
```

## 4. Add GitHub repository variables

Add these repository variables in GitHub:

- `GCP_PROJECT_ID`: your Google Cloud project ID
- `GCP_REGION`: the Cloud Run region, for example `us-central1`
- `GCP_WORKLOAD_IDENTITY_PROVIDER`: full provider resource name from the previous step
- `GCP_SERVICE_ACCOUNT`: deployer service account email
- `CLOUD_RUN_SERVICE`: Cloud Run service name
- `CLOUD_RUN_SOURCE_DIRECTORY`: relative path to the app source if deploying from source
- `CLOUD_RUN_IMAGE`: optional full container image URI if deploying a prebuilt image
- `CLOUD_RUN_MANIFEST`: optional relative path to a Cloud Run manifest if deploying from YAML

Only one of `CLOUD_RUN_SOURCE_DIRECTORY`, `CLOUD_RUN_IMAGE`, or `CLOUD_RUN_MANIFEST` is required for deployment.

## 5. Customize the deployment

If you want a YAML-based deployment, copy `/home/runner/work/skills/skills/deploy/cloud-run/service.template.yaml` and replace the placeholder values with your service configuration.

The workflow supports two patterns:

1. **Deploy from source** with `gcloud run deploy --source`
2. **Deploy from YAML** with `gcloud run services replace`

## 6. Trigger the workflow

The workflow runs automatically on pushes to `main` when the required variables are present, and it can also be started manually with **Run workflow** in GitHub Actions.
 
For a manual run you can override:
 
- branch to deploy from
- source directory
- service name
- region
- image
- manifest path
- unauthenticated access

## 7. Verify the connection

After the first workflow run:

1. Confirm the authentication step succeeds
2. Confirm the deploy step completes without IAM or API errors
3. Open the Cloud Run URL reported in the workflow summary
4. If the service is private, test it with an authenticated caller that has `roles/run.invoker`

## 8. Security recommendations

- Keep using Workload Identity Federation instead of service account keys
- Restrict deployments to protected branches
- Limit the deployer service account to only the roles your service needs
- Store runtime secrets in Google Secret Manager or GitHub Secrets, not in the repository

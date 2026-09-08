# Deploying this project

The API and its PostgreSQL database run on Google Cloud, the frontend on Vercel, and Terraform in [`infra/`](infra/) describes all three. CI runs on every pull request, and a push to `main` deploys.

|                       |                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------- |
| API                   | Cloud Run, `europe-north1`, the image built from `apps/api/Dockerfile`             |
| Database              | Cloud SQL for PostgreSQL 16, `europe-north1`, reached over the Cloud SQL connector |
| Frontend              | Vercel, rendering in `arn1`, the closest region to the API                         |
| Image registry, state | Artifact Registry and a GCS bucket, both `europe-north1`                           |

Every page is rendered on Vercel's servers and calls the API, so the regions are picked to sit next to each other and next to Finnish users.

## Layout

|                                |                                                                          |
| ------------------------------ | ------------------------------------------------------------------------ |
| `infra/bootstrap`              | applied once, by hand: APIs, state bucket, image registry, CI's identity |
| `infra`                        | applied by CI: database, Cloud Run service, Vercel project               |
| `.github/workflows/ci.yml`     | CI's two jobs, `make check` and `make e2e`                               |
| `.github/workflows/deploy.yml` | image, data layer, migrations, API rollout, frontend                     |

Both workflows drive the `Makefile` rather than restating its commands, so CI and your machine run the same thing. `make db-migrate` migrates and seeds whatever `DATABASE_URL` points at.

## One-time setup

You need the `gcloud`, `terraform` and `gh` CLIs, a Google Cloud project with billing enabled, and a Vercel account. `./scripts/first-deploy.sh` walks every step below, opening each page and capturing each value into the GitHub variables the workflows read; it is re-runnable and remembers what it already captured. By hand:

**1. Bootstrap Google Cloud.** `infra/bootstrap` keeps local state, because it is what creates the bucket the main stack's state lives in.

```
gcloud auth application-default login
cd infra/bootstrap
cp terraform.tfvars.example terraform.tfvars   # set project_id
terraform init
terraform apply
```

The identity it creates is Workload Identity Federation, so GitHub Actions authenticates without a service account key, and only from `refs/heads/main` of the repository named in `github_repository`.

**2. Create a Vercel token** at Vercel → Settings → Tokens, with access to the account or team you want the project in. Terraform creates the project itself, so nothing needs to exist in Vercel first.

**3. Configure the repository.** `terraform output github_repository_variables` prints the values for the first six.

```
gh variable set GCP_PROJECT_ID                 --body "..."
gh variable set GCP_REGION                     --body "europe-north1"
gh variable set GCP_SERVICE_ACCOUNT            --body "..."
gh variable set GCP_WORKLOAD_IDENTITY_PROVIDER --body "..."
gh variable set ARTIFACT_REGISTRY_REPO         --body "..."
gh variable set TF_STATE_BUCKET                --body "..."
gh secret   set VERCEL_API_TOKEN                --body "..."
```

Set `VERCEL_TEAM` as a repository variable too if the project belongs to a team rather than a personal account.

**4. Protect `main`.** This step is load-bearing, not hygiene: `deploy.yml` does not run CI, it trusts the pull request's run, so a merge deploys immediately instead of testing the same tree twice. That is only safe if nothing can reach `main` without having passed CI first.

```
gh api -X PUT "repos/{owner}/{repo}/branches/main/protection" --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Lint, typecheck, test, build", "End-to-end"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

`"strict": true` requires the branch to be up to date, so a stale branch cannot merge past a change it never saw, and `"enforce_admins": true` blocks direct pushes, including your own.

**5. Push to `main`.** The `Deploy` workflow does the rest. The first run takes roughly fifteen minutes, most of it Cloud SQL creating the instance.

## What a deploy does

```
image  →  database  →  infra  →  web
```

1. **image**: builds `apps/api/Dockerfile` and pushes it to Artifact Registry tagged with the commit SHA.
2. **database**: `terraform apply -target=module.database`, then the Cloud SQL Auth Proxy, `prisma migrate deploy` and `scripts/seed-db.sh` (which loads the dataset only if `electricitydata` is empty), all via `make db-migrate`.
3. **infra**: the full `terraform apply`, with that tag as `api_image`. This rolls out the new Cloud Run revision and writes the Cloud Run URL into the Vercel project as `NEXT_PUBLIC_API_BASE_URL`.
4. **web**: `vercel deploy --prod`, which builds `apps/web` on Vercel using the project settings Terraform manages.

A deploy is serialised by a `concurrency` group and is never cancelled part-way, so a queued push waits rather than interrupting a migration.

The stack is applied twice because the schema has to be current before the code that assumes it starts serving, and nothing in the targeted pass can bring up a revision, since the Cloud Run service is not in its plan. Terraform warns on that pass that targeting is in effect and may be incomplete; the untargeted apply minutes later is the verification it asks for. Keep `-target` naming a module rather than a list of resources, so a resource the migration depends on belongs in `infra/modules/database` and not in the root. The alternative, `ignore_changes` on the Cloud Run image plus a `gcloud run services update` after the migration, drops the image out of state, so `terraform plan` stops answering what is live.

## Manual operations

Terraform can be run locally against the same state:

```
cd infra
terraform init -backend-config="bucket=$(cd bootstrap && terraform output -raw state_bucket)"
terraform plan -var="api_image=..." -var="vercel_api_token=..."
```

To reach the deployed database from your machine:

```
gcloud secrets versions access latest --secret=electricity-database-password
cloud-sql-proxy --port 5433 "$(terraform -chdir=infra output -raw sql_connection_name)"
```

The instance has a public IP but no authorised networks and `ssl_mode = ENCRYPTED_ONLY`, so the connector is the only way in.

## Costs

The defaults are the small end of every knob: `db-f1-micro` Cloud SQL with 10 GB of storage, Cloud Run scaled to zero with a ceiling of four instances, and Vercel's Hobby allowances. Cloud SQL is the only part that bills whether or not anyone visits, since it cannot scale to zero.

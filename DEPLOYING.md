# Deploying this project

The API and its PostgreSQL database run on Google Cloud, the frontend on Vercel, and all three
are described by Terraform in [`infra/`](infra/). GitHub Actions runs CI on every pull request,
and a push to `main` deploys everything.

|                       |                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------- |
| API                   | Cloud Run, `europe-north1` (Hamina), the image built from `apps/api/Dockerfile`    |
| Database              | Cloud SQL for PostgreSQL 16, `europe-north1`, reached over the Cloud SQL connector |
| Frontend              | Vercel, rendering in `arn1` (Stockholm), the closest region to the API             |
| Image registry, state | Artifact Registry and a GCS bucket, both `europe-north1`                           |

Regions are picked to sit next to each other and next to Finnish users. Every page is rendered
on Vercel's servers and calls the API, so Stockholm to Hamina is one short hop; Vercel's default
`iad1` would have put an Atlantic crossing on every render. `arn1` is billed 10% above `iad1` on
metered requests, with the same included allowance and the same data transfer rates.

## Layout

|                                |                                                                          |
| ------------------------------ | ------------------------------------------------------------------------ |
| `infra/bootstrap`              | applied once, by hand: APIs, state bucket, image registry, CI's identity |
| `infra`                        | applied by CI: database, Cloud Run service, Vercel project               |
| `infra/modules/database`       | the data layer, applied on its own so migrations precede a rollout       |
| `scripts/seed-db.sh`           | loads `db/init-db.tar.gz` into an empty database                         |
| `.github/workflows/ci.yml`     | `make check` and `make e2e`                                              |
| `.github/workflows/deploy.yml` | image, data layer, migrations, API rollout, frontend                     |

Both workflows drive the `Makefile` rather than restating its commands, so CI and your machine
run the same thing. `make check` is everything CI checks; `make db-migrate` migrates and seeds
whatever `DATABASE_URL` points at.

## One-time setup

You need the `gcloud`, `terraform` and `gh` CLIs, a Google Cloud project with billing enabled,
and a Vercel account.

```
./scripts/first-deploy.sh
```

walks all of it, opening each page and capturing each value into the GitHub variables the
workflows read. It is re-runnable and remembers what it already captured. The rest of this
section is what it does, for when you would rather do it by hand.

### 1. Bootstrap Google Cloud

`infra/bootstrap` keeps local state, because it is what creates the bucket the main stack's state
lives in.

```
gcloud auth application-default login
cd infra/bootstrap
cp terraform.tfvars.example terraform.tfvars   # set project_id
terraform init
terraform apply
```

This enables the APIs, creates the state bucket and the Docker repository, and sets up Workload
Identity Federation so GitHub Actions can authenticate without a service account key. Only
`refs/heads/main` of the repository named in `github_repository` is allowed to do so.

### 2. Create a Vercel token

Create one at **Vercel → Settings → Tokens** with access to the account or team you want the
project in. Terraform creates the project itself, so nothing needs to exist in Vercel first.

### 3. Configure the repository

`terraform output github_repository_variables` prints the values for the first six.

```
gh variable set GCP_PROJECT_ID                 --body "..."
gh variable set GCP_REGION                     --body "europe-north1"
gh variable set GCP_SERVICE_ACCOUNT            --body "..."
gh variable set GCP_WORKLOAD_IDENTITY_PROVIDER --body "..."
gh variable set ARTIFACT_REGISTRY_REPO         --body "..."
gh variable set TF_STATE_BUCKET                --body "..."
gh secret   set VERCEL_API_TOKEN                --body "..."
```

Set `VERCEL_TEAM` as a repository variable too if the project belongs to a team rather than a
personal account.

### 4. Protect `main`

**This step is load-bearing, not hygiene.** `deploy.yml` does not run CI: it trusts the pull
request's run, so a merge deploys immediately instead of testing the same tree twice. That is
only safe if nothing can reach `main` without having passed CI first, which means requiring both
CI checks, requiring the branch to be up to date so a stale branch cannot merge past a change it
never saw, and blocking direct pushes — including your own.

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

`"strict": true` is the up-to-date requirement and `"enforce_admins": true` is what stops a
direct push. Every change to `main` now goes through a pull request. If you would rather keep
pushing straight to `main`, put the CI job at the top of `deploy.yml`:

```yaml
jobs:
  ci:
    uses: ./.github/workflows/ci.yml
  image:
    needs: ci
```

and add `workflow_call:` back to `ci.yml`'s triggers.

### 5. Push to `main`

The `Deploy` workflow does the rest. The first run takes roughly fifteen minutes, most of it
Cloud SQL creating the instance.

## What a deploy does

```
image  →  database  →  infra  →  web
```

1. **image** — builds `apps/api/Dockerfile` and pushes it to Artifact Registry tagged with the
   commit SHA.
2. **database** — `terraform apply -target=module.database`, then the Cloud SQL Auth Proxy,
   `prisma migrate deploy` and `scripts/seed-db.sh` (which loads the dataset only if
   `electricitydata` is empty), all via `make db-migrate`.
3. **infra** — the full `terraform apply`, with that tag as `api_image`. This is what rolls out
   the new Cloud Run revision and writes the Cloud Run URL into the Vercel project as
   `NEXT_PUBLIC_API_BASE_URL`.
4. **web** — `vercel deploy --prod`, which builds `apps/web` on Vercel using the project settings
   Terraform manages.

A deploy is serialised by a `concurrency` group and is never cancelled part-way, so a queued push
waits rather than interrupting a migration.

### Why the stack is applied twice

The schema has to be current before the code that assumes it starts serving. So the deploy applies
`module.database` on its own, migrates, and only then applies the rest — the pass that creates the
new Cloud Run revision. Nothing in between can bring up a revision, because the Cloud Run service
is not in the targeted plan.

Terraform says `-target` is not for routine use, so the first pass always warns that targeting is in effect and may be incomplete. Expected: the untargeted apply minutes later is the verification the warning asks for. It names a _module_ rather than a list of resources, which is the rule to keep — a resource the migration depends on belongs in `infra/modules/database`, not in the root.

The alternative is `ignore_changes` on the Cloud Run image and a `gcloud run services update` after the migration. That drops the image out of state, so `terraform plan` stops answering what is live.

## Manual operations

Terraform can be run locally against the same state:

```
cd infra
terraform init -backend-config="bucket=$(cd bootstrap && terraform output -raw state_bucket)"
terraform plan -var="api_image=$(...)" -var="vercel_api_token=..."
```

`TF_VAR_vercel_api_token` and `VERCEL_API_TOKEN` are both read, so exporting either is enough.

To reach the deployed database from your machine:

```
gcloud secrets versions access latest --secret=electricity-database-password
cloud-sql-proxy --port 5433 "$(terraform -chdir=infra output -raw sql_connection_name)"
```

The instance has a public IP but no authorised networks and `ssl_mode = ENCRYPTED_ONLY`, so the
connector is the only way in.

## Costs

The defaults are the small end of every knob: `db-f1-micro` Cloud SQL with 10 GB of storage, Cloud Run scaled to zero with a ceiling of four instances, and Vercel's Hobby allowances. Cloud SQL is the only part that bills whether or not anyone visits, since it cannot scale to zero. `api_min_instances` trades a cold start on the first request for a warm instance you pay for.

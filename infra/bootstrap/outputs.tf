output "state_bucket" {
  description = "Pass this to `terraform init -backend-config=bucket=...` for the main stack"
  value       = google_storage_bucket.state.name
}

output "artifact_registry_repository" {
  description = "Docker repository the API image is pushed to"
  value       = google_artifact_registry_repository.images.repository_id
}

output "artifact_registry_host" {
  description = "Registry host to authenticate Docker against"
  value       = "${var.region}-docker.pkg.dev"
}

output "workload_identity_provider" {
  description = "Full provider resource name for google-github-actions/auth"
  value       = google_iam_workload_identity_pool_provider.github.name
}

output "deployer_service_account" {
  description = "Service account GitHub Actions impersonates"
  value       = google_service_account.deployer.email
}

output "github_repository_variables" {
  description = "Repository variables to set with `gh variable set`"
  value = {
    GCP_PROJECT_ID                 = var.project_id
    GCP_REGION                     = var.region
    GCP_SERVICE_ACCOUNT            = google_service_account.deployer.email
    GCP_WORKLOAD_IDENTITY_PROVIDER = google_iam_workload_identity_pool_provider.github.name
    ARTIFACT_REGISTRY_REPO         = google_artifact_registry_repository.images.repository_id
    TF_STATE_BUCKET                = google_storage_bucket.state.name
  }
}

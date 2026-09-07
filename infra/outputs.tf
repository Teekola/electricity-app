output "api_url" {
  description = "Public URL of the Cloud Run API"
  value       = google_cloud_run_v2_service.api.uri
}

output "api_service_name" {
  description = "Cloud Run service name"
  value       = google_cloud_run_v2_service.api.name
}

output "sql_connection_name" {
  description = "Instance connection name for the Cloud SQL Auth Proxy"
  value       = module.database.connection_name
}

output "database_name" {
  value = module.database.database_name
}

output "database_user" {
  value = module.database.database_user
}

output "database_password_secret" {
  description = "Secret Manager secret ID holding the database password"
  value       = module.database.password_secret_id
}

output "vercel_project_id" {
  description = "Set as VERCEL_PROJECT_ID for the Vercel CLI"
  value       = vercel_project.web.id
}

output "vercel_org_id" {
  description = "Set as VERCEL_ORG_ID for the Vercel CLI"
  value       = vercel_project.web.team_id
}

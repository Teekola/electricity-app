output "connection_name" {
  description = "Instance connection name, for the connector and the Auth Proxy"
  value       = google_sql_database_instance.main.connection_name
}

output "database_name" {
  value = google_sql_database.main.name
}

output "database_user" {
  value = google_sql_user.api.name
}

output "url_secret_id" {
  description = "Short secret ID, which is what Cloud Run's secret_key_ref wants"
  value       = google_secret_manager_secret.database_url.secret_id
}

output "url_secret_name" {
  description = "Fully qualified secret name, which is what the IAM member wants"
  value       = google_secret_manager_secret.database_url.id
}

output "password_secret_id" {
  description = "Secret holding just the password, for migrations over the Auth Proxy"
  value       = google_secret_manager_secret.database_password.secret_id
}

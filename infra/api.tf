resource "google_service_account" "api" {
  account_id   = "${var.name_prefix}-api"
  display_name = "Electricity API on Cloud Run"
}

resource "google_project_iam_member" "api_cloudsql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = google_service_account.api.member
}

resource "google_secret_manager_secret_iam_member" "api_database_url" {
  secret_id = module.database.url_secret_name
  role      = "roles/secretmanager.secretAccessor"
  member    = google_service_account.api.member
}

resource "google_cloud_run_v2_service" "api" {
  name     = "${var.name_prefix}-api"
  location = var.region
  # Vercel's servers render every page, and their egress has no fixed addresses.
  ingress             = "INGRESS_TRAFFIC_ALL"
  deletion_protection = false

  template {
    service_account = google_service_account.api.email
    timeout         = "30s"

    scaling {
      min_instance_count = var.api_min_instances
      max_instance_count = var.api_max_instances
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [module.database.connection_name]
      }
    }

    containers {
      image = var.api_image

      # Cloud Run sets PORT to this, and apps/api/src/config.ts reads it.
      ports {
        container_port = 8080
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "LOG_LEVEL"
        value = var.api_log_level
      }

      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = module.database.url_secret_id
            version = "latest"
          }
        }
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        cpu_idle          = true
        startup_cpu_boost = true
      }

      startup_probe {
        initial_delay_seconds = 5
        period_seconds        = 5
        timeout_seconds       = 3
        failure_threshold     = 10
        http_get {
          path = "/health"
        }
      }

      liveness_probe {
        period_seconds    = 30
        timeout_seconds   = 3
        failure_threshold = 3
        http_get {
          path = "/health"
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  # The revision reads the secret at start-up, so the grant has to be in place first.
  depends_on = [google_secret_manager_secret_iam_member.api_database_url]
}

resource "google_cloud_run_v2_service_iam_member" "public" {
  name     = google_cloud_run_v2_service.api.name
  location = google_cloud_run_v2_service.api.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

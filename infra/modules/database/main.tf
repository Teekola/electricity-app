# Everything the schema and the dataset need, and nothing that serves traffic. The deploy
# pipeline applies this module on its own first, so migrations land before any new API
# revision exists. Keep it that way: a resource added here is covered by that targeted
# apply automatically, whereas one added to the root module is not.

resource "random_password" "database" {
  length = 32
  # Restricted to RFC 3986 unreserved punctuation so the password survives being put in a URL.
  override_special = "-_.~"
}

resource "google_sql_database_instance" "main" {
  name                = "${var.name_prefix}-postgres"
  region              = var.region
  database_version    = "POSTGRES_16"
  deletion_protection = var.deletion_protection

  settings {
    tier              = var.tier
    edition           = "ENTERPRISE"
    availability_type = "ZONAL"
    disk_size         = 10
    disk_type         = "PD_SSD"
    disk_autoresize   = true

    ip_configuration {
      # The connectors in Cloud Run and in CI dial the public IP but authenticate with IAM
      # and mTLS, so no network is authorised and plain Postgres clients cannot reach it.
      ipv4_enabled = true
      ssl_mode     = "ENCRYPTED_ONLY"
    }

    backup_configuration {
      enabled    = true
      start_time = "02:00"
    }

    maintenance_window {
      day  = 7
      hour = 3
    }
  }
}

resource "google_sql_database" "main" {
  name     = var.database_name
  instance = google_sql_database_instance.main.name
}

resource "google_sql_user" "api" {
  name     = var.database_user
  instance = google_sql_database_instance.main.name
  password = random_password.database.result
}

locals {
  # Cloud Run reaches Cloud SQL over the unix socket the mounted connector exposes;
  # `pg` switches to a socket because the `host` query parameter is an absolute path.
  api_database_url = join("", [
    "postgresql://",
    var.database_user,
    ":",
    urlencode(random_password.database.result),
    "@localhost/",
    var.database_name,
    "?host=/cloudsql/",
    google_sql_database_instance.main.connection_name,
  ])
}

resource "google_secret_manager_secret" "database_url" {
  secret_id = "${var.name_prefix}-database-url"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "database_url" {
  secret      = google_secret_manager_secret.database_url.id
  secret_data = local.api_database_url
}

# Migrations and seeding run through the Cloud SQL Auth Proxy on a TCP port, so CI
# assembles its own URL and needs the password on its own.
resource "google_secret_manager_secret" "database_password" {
  secret_id = "${var.name_prefix}-database-password"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "database_password" {
  secret      = google_secret_manager_secret.database_password.id
  secret_data = random_password.database.result
}

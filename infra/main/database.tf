resource "google_sql_database_instance" "main" {
  name                = "meet-poll"
  database_version    = "POSTGRES_18"
  region              = var.region
  deletion_protection = true

  settings {
    edition                     = "ENTERPRISE"
    tier                        = "db-f1-micro"
    availability_type           = "ZONAL"
    disk_type                   = "PD_SSD"
    disk_size                   = 10
    deletion_protection_enabled = true

    backup_configuration {
      enabled = false
    }

    # Public IP without authorized networks: reachable only via the IAM-checked Cloud SQL connector.
    ip_configuration {
      ipv4_enabled = true
      ssl_mode     = "ENCRYPTED_ONLY"
    }
  }
}

resource "google_sql_database" "app" {
  name     = "meetpoll"
  instance = google_sql_database_instance.main.name
}

ephemeral "random_password" "db" {
  length  = 32
  special = false
}

resource "google_sql_user" "app" {
  name                = "meetpoll"
  instance            = google_sql_database_instance.main.name
  password_wo         = ephemeral.random_password.db.result
  password_wo_version = var.db_password_version
}

resource "google_secret_manager_secret" "database_url" {
  secret_id = "database-url"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "database_url" {
  secret                 = google_secret_manager_secret.database_url.id
  secret_data_wo_version = var.db_password_version
  secret_data_wo = format(
    "postgresql://%s:%s@%s:5432/%s",
    google_sql_user.app.name,
    ephemeral.random_password.db.result,
    urlencode("/cloudsql/${google_sql_database_instance.main.connection_name}"),
    google_sql_database.app.name,
  )
}

resource "google_secret_manager_secret_iam_member" "backend" {
  secret_id = google_secret_manager_secret.database_url.id
  role      = "roles/secretmanager.secretAccessor"
  member    = google_service_account.runtime["backend"].member
}

resource "google_project_iam_member" "backend_cloudsql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = google_service_account.runtime["backend"].member
}

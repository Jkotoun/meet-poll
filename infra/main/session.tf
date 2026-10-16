ephemeral "random_password" "jwt" {
  length  = 64
  special = false
}

resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "jwt-secret"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "jwt_secret" {
  secret                 = google_secret_manager_secret.jwt_secret.id
  secret_data_wo         = ephemeral.random_password.jwt.result
  secret_data_wo_version = var.jwt_secret_version

  lifecycle {
    create_before_destroy = true
  }
}

resource "google_secret_manager_secret_iam_member" "backend_jwt_secret" {
  secret_id = google_secret_manager_secret.jwt_secret.id
  role      = "roles/secretmanager.secretAccessor"
  member    = google_service_account.runtime["backend"].member
}

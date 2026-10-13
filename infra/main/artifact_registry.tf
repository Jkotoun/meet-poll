resource "google_artifact_registry_repository" "images" {
  repository_id = "meet-poll"
  format        = "DOCKER"
  location      = var.region

  # Rollback window. Each push adds ~3 versions (index, platform manifest,
  # attestation), so 30 is roughly the last 10 deploys. Deleting also requires
  # 30+ days of age, so evicting the image still serving would take 10 failed
  # deploys in a row after a month without a successful one.
  cleanup_policies {
    id     = "keep-recent"
    action = "KEEP"
    most_recent_versions {
      keep_count = 30
    }
  }

  cleanup_policies {
    id     = "delete-old"
    action = "DELETE"
    condition {
      tag_state  = "ANY"
      older_than = "2592000s"
    }
  }
}

resource "google_artifact_registry_repository_iam_member" "deployer" {
  repository = google_artifact_registry_repository.images.name
  location   = google_artifact_registry_repository.images.location
  role       = "roles/artifactregistry.writer"
  member     = data.google_service_account.deployer.member
}

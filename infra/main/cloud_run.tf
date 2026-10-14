resource "google_cloud_run_v2_service" "app" {
  for_each = local.services

  name     = "meet-poll-${each.key}"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.runtime[each.key].email

    scaling {
      min_instance_count = 0
      max_instance_count = 2
    }

    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello"

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        cpu_idle = true
      }

      startup_probe {
        http_get {
          path = each.value.health_path
        }
        period_seconds    = 2
        failure_threshold = 15
      }
    }
  }

  # Image, env, traffic and gcloud-stamped metadata are owned by CD.
  lifecycle {
    ignore_changes = [
      client,
      client_version,
      template[0].containers[0].image,
      template[0].containers[0].env,
      template[0].labels,
      template[0].annotations,
      traffic,
    ]
  }

  depends_on = [google_service_account_iam_member.runtime_terraform]
}

resource "google_cloud_run_v2_service_iam_member" "public" {
  for_each = google_cloud_run_v2_service.app

  name     = each.value.name
  location = each.value.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_member" "deployer" {
  for_each = google_cloud_run_v2_service.app

  name     = each.value.name
  location = each.value.location
  role     = "roles/run.developer"
  member   = data.google_service_account.deployer.member
}

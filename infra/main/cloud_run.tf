resource "google_cloud_run_v2_service" "this" {
  for_each = local.services

  name     = "meet-poll-${each.key}"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = data.google_service_account.runtime[each.key].email

    scaling {
      min_instance_count = 0
      max_instance_count = 2
    }

    containers {
      # Placeholder until CD deploys the real image; CD owns the image from
      # then on (see lifecycle below).
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

  # Terraform owns resources, scaling, probes and identity; CD owns the image,
  # env vars and which revision serves. CD deploys each image as a no-traffic
  # revision, smoke-tests it, then routes 100% to exactly that revision, and
  # redeploys whenever the newest revision isn't the serving one — so a
  # template change made here goes live only after passing the smoke test.
  # Traffic must stay ignored: resetting it to "latest" would serve
  # revisions that were never tested.
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

}

resource "google_cloud_run_v2_service_iam_member" "public" {
  for_each = google_cloud_run_v2_service.this

  name     = each.value.name
  location = each.value.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_member" "deployer" {
  for_each = google_cloud_run_v2_service.this

  name     = each.value.name
  location = each.value.location
  role     = "roles/run.developer"
  member   = data.google_service_account.deployer.member
}

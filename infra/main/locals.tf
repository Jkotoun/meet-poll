locals {
  # Each service needs a matching entry in bootstrap's cloud_run_services.
  services = {
    backend  = { health_path = "/health" }
    frontend = { health_path = "/" }
  }
}

# Identities come from infra/bootstrap. Looking them up (rather than building
# emails) fails the plan, not a half-done apply, if one is missing.
data "google_service_account" "runtime" {
  for_each = local.services

  account_id = "run-${each.key}"
}

data "google_service_account" "deployer" {
  account_id = "github-deployer"
}

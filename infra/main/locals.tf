locals {
  services = {
    backend  = { health_path = "/health" }
    frontend = { health_path = "/" }
  }
}

# Identities come from infra/bootstrap.
data "google_service_account" "terraform" {
  account_id = "github-terraform"
}

data "google_service_account" "deployer" {
  account_id = "github-deployer"
}

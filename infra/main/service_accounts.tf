data "google_service_account" "terraform" {
  account_id = "github-terraform"
}

data "google_service_account" "deployer" {
  account_id = "github-deployer"
}

resource "google_service_account" "runtime" {
  for_each = local.services

  account_id   = "run-${each.key}"
  display_name = "Cloud Run runtime — ${each.key}"
}

resource "google_service_account_iam_member" "runtime_terraform" {
  for_each = google_service_account.runtime

  service_account_id = each.value.name
  role               = "roles/iam.serviceAccountUser"
  member             = data.google_service_account.terraform.member
}

resource "google_service_account_iam_member" "runtime_deployer" {
  for_each = google_service_account.runtime

  service_account_id = each.value.name
  role               = "roles/iam.serviceAccountUser"
  member             = data.google_service_account.deployer.member
}

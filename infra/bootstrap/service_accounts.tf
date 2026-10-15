# Plans PRs from any branch, so it's read-only.
resource "google_service_account" "planner" {
  account_id   = "github-planner"
  display_name = "GitHub Actions — Terraform plan"

  depends_on = [google_project_service.this]
}

resource "google_project_iam_member" "planner" {
  for_each = toset([
    "roles/viewer",
    "roles/iam.securityReviewer",
  ])

  project = var.project_id
  role    = each.value
  member  = google_service_account.planner.member
}

resource "google_storage_bucket_iam_member" "planner_state" {
  bucket = google_storage_bucket.tfstate.name
  role   = "roles/storage.objectViewer"
  member = google_service_account.planner.member
}

resource "google_service_account_iam_member" "planner_wif" {
  service_account_id = google_service_account.planner.name
  role               = "roles/iam.workloadIdentityUser"
  member             = local.any_workflow
}

# Applies infra/main; only usable from the `prod` Environment, so every apply
# needs the Environment's approval.
resource "google_service_account" "terraform" {
  account_id   = "github-terraform"
  display_name = "GitHub Actions — Terraform apply"

  depends_on = [google_project_service.this]
}

resource "google_project_iam_member" "terraform" {
  for_each = toset([
    "roles/artifactregistry.admin",
    "roles/cloudsql.admin",
    "roles/iam.serviceAccountAdmin",
    "roles/resourcemanager.projectIamAdmin",
    "roles/run.admin",
    "roles/secretmanager.admin",
  ])

  project = var.project_id
  role    = each.value
  member  = google_service_account.terraform.member
}

resource "google_storage_bucket_iam_member" "terraform_state" {
  bucket = google_storage_bucket.tfstate.name
  role   = "roles/storage.objectAdmin"
  member = google_service_account.terraform.member
}

resource "google_service_account_iam_member" "terraform_wif" {
  service_account_id = google_service_account.terraform.name
  role               = "roles/iam.workloadIdentityUser"
  member             = local.prod_env_jobs
}

# Pushes images and deploys revisions; its rights on the registry and the
# services are granted in infra/main.
resource "google_service_account" "deployer" {
  account_id   = "github-deployer"
  display_name = "GitHub Actions — app deployer"

  depends_on = [google_project_service.this]
}

resource "google_project_iam_member" "deployer" {
  project = var.project_id
  role    = "roles/run.viewer"
  member  = google_service_account.deployer.member
}

resource "google_service_account_iam_member" "deployer_wif" {
  service_account_id = google_service_account.deployer.name
  role               = "roles/iam.workloadIdentityUser"
  member             = local.main_jobs
}

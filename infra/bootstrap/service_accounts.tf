locals {
  pool_principals = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}"
  state_bucket    = "projects/_/buckets/${google_storage_bucket.tfstate.name}"

  # Must match infra/main's backend prefix. Bootstrap's own state shares the
  # bucket and must not be writable from CI. (Reads aren't restricted: GCS's
  # legacy convenience bindings let any project viewer read the bucket.)
  main_state_prefix = "main/"
  main_state_condition = join(" || ", [
    "(resource.type == 'storage.googleapis.com/Bucket' && api.getAttribute('storage.googleapis.com/objectListPrefix', '').startsWith('${local.main_state_prefix}'))",
    "resource.name.startsWith('${local.state_bucket}/objects/${local.main_state_prefix}')",
  ])
}

# PRs plan with a read-only identity so pushing a branch never grants write
# access to prod.
resource "google_service_account" "planner" {
  account_id   = "github-planner"
  display_name = "GitHub Actions — Terraform plan"

  depends_on = [google_project_service.this]
}

resource "google_project_iam_member" "planner" {
  for_each = toset([
    "roles/viewer",
    # Plan refreshes IAM policies on the services and repository.
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

  condition {
    title      = "infra-main-state-only"
    expression = local.main_state_condition
  }
}

# The pool already only admits this repository, so any of its workflows may
# plan.
resource "google_service_account_iam_member" "planner_wif" {
  service_account_id = google_service_account.planner.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "${local.pool_principals}/*"
}

# No service-account, project-IAM or service-usage admin role: bootstrap owns
# identities, grants and API enablement, and each of those roles would let
# this identity escalate (grant itself any identity or owner) or disable the
# APIs CI authenticates through.
resource "google_service_account" "terraform" {
  account_id   = "github-terraform"
  display_name = "GitHub Actions — Terraform apply"

  depends_on = [google_project_service.this]
}

resource "google_project_iam_member" "terraform" {
  for_each = toset([
    "roles/artifactregistry.admin",
    "roles/run.admin",
    # infra/main looks up the runtime identities it deploys services as.
    "roles/iam.serviceAccountViewer",
  ])

  project = var.project_id
  role    = each.value
  member  = google_service_account.terraform.member
}

resource "google_storage_bucket_iam_member" "terraform_state" {
  bucket = google_storage_bucket.tfstate.name
  role   = "roles/storage.objectAdmin"
  member = google_service_account.terraform.member

  condition {
    title      = "infra-main-state-only"
    expression = local.main_state_condition
  }
}

# Bound to the OIDC subject GitHub issues only to jobs running in the `prod`
# Environment, so its required reviewer is an IAM boundary, not just a
# workflow convention.
resource "google_service_account_iam_member" "terraform_wif" {
  service_account_id = google_service_account.terraform.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principal://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/subject/repo:${var.github_repository}:environment:prod"
}

# Its write rights on the registry and services are granted on those
# resources in infra/main.
resource "google_service_account" "deployer" {
  account_id   = "github-deployer"
  display_name = "GitHub Actions — app deployer"

  depends_on = [google_project_service.this]
}

# Read-only: CD reads which revision (and image) each service is serving.
resource "google_project_iam_member" "deployer_run_viewer" {
  project = var.project_id
  role    = "roles/run.viewer"
  member  = google_service_account.deployer.member
}

# Pinned to push events on main: other events (pull_request_target,
# issue_comment, workflow_run, schedule) also carry ref=refs/heads/main and can
# run fork-controlled code.
resource "google_service_account_iam_member" "deployer_wif" {
  service_account_id = google_service_account.deployer.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "${local.pool_principals}/attribute.ref_event/refs/heads/main:push"
}

# Created here rather than in infra/main so CI never manages service accounts;
# both write identities need actAs to create services and deploy revisions.
resource "google_service_account" "runtime" {
  for_each = toset(var.cloud_run_services)

  account_id   = "run-${each.key}"
  display_name = "Cloud Run runtime — ${each.key}"

  depends_on = [google_project_service.this]
}

locals {
  runtime_act_as_members = {
    terraform = google_service_account.terraform.member
    deployer  = google_service_account.deployer.member
  }
}

resource "google_service_account_iam_member" "runtime_act_as" {
  for_each = {
    for pair in setproduct(var.cloud_run_services, keys(local.runtime_act_as_members)) :
    "${pair[0]}/${pair[1]}" => { service = pair[0], member = local.runtime_act_as_members[pair[1]] }
  }

  service_account_id = google_service_account.runtime[each.value.service].name
  role               = "roles/iam.serviceAccountUser"
  member             = each.value.member
}

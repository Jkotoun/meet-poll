resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github"
  display_name              = "GitHub Actions"

  depends_on = [google_project_service.this]
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-actions"
  display_name                       = "GitHub Actions OIDC"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }

  attribute_mapping = {
    "google.subject" = "assertion.sub"
  }

  # Without a condition any GitHub repository could mint tokens for this pool.
  attribute_condition = "assertion.repository_id == '${var.github_repository_id}'"
}

locals {
  pool = "iam.googleapis.com/${google_iam_workload_identity_pool.github.name}"

  any_workflow  = "principalSet://${local.pool}/*"
  prod_env_jobs = "principal://${local.pool}/subject/repo:${var.github_repository}:environment:prod"
  main_jobs     = "principal://${local.pool}/subject/repo:${var.github_repository}:ref:refs/heads/main"
}

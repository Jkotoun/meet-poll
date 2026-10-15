output "workload_identity_provider" {
  value = google_iam_workload_identity_pool_provider.github.name
}

output "planner_service_account" {
  value = google_service_account.planner.email
}

output "terraform_service_account" {
  value = google_service_account.terraform.email
}

output "deployer_service_account" {
  value = google_service_account.deployer.email
}

output "state_bucket" {
  value = google_storage_bucket.tfstate.name
}

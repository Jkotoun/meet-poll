terraform {
  required_version = "~> 1.14.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 8.6"
    }
  }

  # No backend: state stays local, since this stack creates the state bucket.
}

provider "google" {
  project = var.project_id
  region  = var.region
}

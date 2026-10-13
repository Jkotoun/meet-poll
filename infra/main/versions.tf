terraform {
  required_version = "~> 1.14.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 8.6"
    }
  }

  # The prefix is what infra/bootstrap's state IAM conditions allow CI to
  # read and write (`main/`); changing it needs a matching bootstrap change.
  backend "gcs" {
    bucket = "project-b4c68586-e430-4157-a61-tfstate"
    prefix = "main"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

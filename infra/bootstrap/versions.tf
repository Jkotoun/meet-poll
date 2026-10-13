terraform {
  required_version = "~> 1.14.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 8.6"
    }
  }

  # The bucket is created once by hand (see README) and adopted below via an
  # import block, since this stack can't store its state in a bucket it has
  # yet to create.
  backend "gcs" {
    bucket = "project-b4c68586-e430-4157-a61-tfstate"
    prefix = "bootstrap"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

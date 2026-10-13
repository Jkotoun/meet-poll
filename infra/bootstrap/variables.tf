variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "github_repository" {
  description = "owner/name of the GitHub repository; part of the OIDC subject the apply identity is bound to."
  type        = string
}

variable "github_repository_id" {
  description = "Numeric GitHub repository ID; pinned in addition to the name because names can be re-registered after a rename or deletion."
  type        = string
}

variable "cloud_run_services" {
  description = "Cloud Run services that get a dedicated runtime service account."
  type        = list(string)

  validation {
    condition = (
      length(distinct(var.cloud_run_services)) == length(var.cloud_run_services)
      && alltrue([for s in var.cloud_run_services : can(regex("^[a-z][a-z0-9-]{1,25}$", s))])
    )
    error_message = "Service names must be unique and form a valid account ID as run-<name> (lowercase, 2-26 chars)."
  }
}

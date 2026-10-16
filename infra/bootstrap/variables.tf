variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "github_repository" {
  description = "owner/name of the GitHub repository."
  type        = string
}

variable "github_repository_id" {
  description = "Numeric GitHub repository ID; unlike the name, it can't be re-registered by someone else."
  type        = string
}

variable "github_owner_id" {
  description = "Numeric ID of the repository owner, part of GitHub's immutable OIDC subject."
  type        = string
}

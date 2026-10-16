variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "db_password_version" {
  description = "Bump to rotate the DB password (new user password and database-url secret version)."
  type        = number
  default     = 1
}

variable "jwt_secret_version" {
  description = "Bump to rotate the session signing secret, then redeploy the backend (signs everyone out)."
  type        = number
  default     = 1
}

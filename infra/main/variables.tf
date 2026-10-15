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

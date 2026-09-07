variable "name_prefix" {
  description = "Prefix for every resource name in this module"
  type        = string
}

variable "region" {
  description = "The Google Cloud region the instance lives in"
  type        = string
}

variable "tier" {
  description = "Cloud SQL machine type"
  type        = string
}

variable "deletion_protection" {
  description = "Refuse to destroy the instance"
  type        = bool
}

variable "database_name" {
  description = "The database the seed is loaded into"
  type        = string
}

variable "database_user" {
  description = "The role the API connects as"
  type        = string
}

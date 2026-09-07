variable "project_id" {
  description = "The Google Cloud project everything is deployed into"
  type        = string
}

variable "region" {
  description = "The Google Cloud region for the database and the API"
  type        = string
  default     = "europe-north1"
}

variable "name_prefix" {
  description = "Prefix for every resource name, so one project can hold more than one environment"
  type        = string
  default     = "electricity"
}

variable "api_image" {
  description = "Fully qualified API image, digest- or tag-pinned. CI passes the commit SHA tag it just pushed."
  type        = string
}

variable "api_log_level" {
  description = "LOG_LEVEL for the API container"
  type        = string
  default     = "info"
}

variable "api_min_instances" {
  description = "Cloud Run instances kept warm. 0 is cheapest and accepts a cold start."
  type        = number
  default     = 0
}

variable "api_max_instances" {
  description = "Cloud Run scale ceiling, which also bounds database connections"
  type        = number
  default     = 4
}

variable "database_tier" {
  description = "Cloud SQL machine type"
  type        = string
  default     = "db-f1-micro"
}

variable "database_deletion_protection" {
  description = "Refuse to destroy the database instance. The dataset is a fixed seed, so this is off by default."
  type        = bool
  default     = false
}

variable "database_user" {
  description = "The role the API connects as. Matches the local Compose setup."
  type        = string
  default     = "academy"
}

variable "database_name" {
  description = "The database the seed is loaded into"
  type        = string
  default     = "electricity"
}

variable "vercel_api_token" {
  description = "Vercel API token used to manage the frontend project"
  type        = string
  sensitive   = true
}

variable "vercel_team" {
  description = "Vercel team slug or ID. Leave null for a personal account."
  type        = string
  default     = null
}

variable "vercel_project_name" {
  description = "Name of the Vercel project hosting apps/web"
  type        = string
  default     = "electricity-app"
}

variable "vercel_function_region" {
  description = "Vercel region the Next.js server renders in. arn1 (Stockholm) is the closest one to europe-north1."
  type        = string
  default     = "arn1"
}

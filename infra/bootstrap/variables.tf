variable "project_id" {
  description = "The Google Cloud project everything is deployed into"
  type        = string
}

variable "region" {
  description = "The Google Cloud region for the state bucket, image registry, database and API"
  type        = string
  default     = "europe-north1"
}

variable "name_prefix" {
  description = "Prefix for every resource name, so one project can hold more than one environment"
  type        = string
  default     = "electricity"
}

variable "state_bucket_name" {
  description = "Name of the Terraform state bucket. Defaults to <project_id>-tfstate."
  type        = string
  default     = null
}

variable "github_repository" {
  description = "The <owner>/<repo> allowed to authenticate as the deployer service account"
  type        = string
  default     = "Teekola/electricity-app"
}

variable "github_deploy_ref" {
  description = "The only git ref allowed to deploy. Widen this to add preview environments."
  type        = string
  default     = "refs/heads/main"
}

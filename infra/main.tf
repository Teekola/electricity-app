terraform {
  required_version = "~> 1.16"

  # The bucket comes from `terraform init -backend-config=bucket=...`, because its name
  # depends on the project and `infra/bootstrap` is what creates it.
  backend "gcs" {
    prefix = "electricity-app"
  }

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 8.1"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.7"
    }
    vercel = {
      source  = "vercel/vercel"
      version = "~> 5.15"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "vercel" {
  api_token = var.vercel_api_token
  # An unset TF_VAR_vercel_team arrives as "", which is not the same as "personal account".
  team = var.vercel_team == "" ? null : var.vercel_team
}

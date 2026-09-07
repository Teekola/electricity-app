# `terraform apply -target=module.database` is phase one of a deploy: see DEPLOYING.md.
module "database" {
  source = "./modules/database"

  name_prefix         = var.name_prefix
  region              = var.region
  tier                = var.database_tier
  deletion_protection = var.database_deletion_protection
  database_name       = var.database_name
  database_user       = var.database_user
}

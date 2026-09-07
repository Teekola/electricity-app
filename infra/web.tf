resource "vercel_project" "web" {
  name           = var.vercel_project_name
  framework      = "nextjs"
  root_directory = "apps/web"
  node_version   = "24.x"

  # `next build` alone would not build @repo/api-contract, which apps/web imports from dist.
  # turbo finds the workspace root itself, so this does not depend on the working directory.
  build_command = "pnpm turbo run build --filter=@repo/web"

  resource_config = {
    # New projects default to iad1, which would put an Atlantic round trip between every
    # page render and the API. One region only, so this also fits the Hobby plan.
    function_default_regions = [var.vercel_function_region]
  }

  # Deployments come from .github/workflows/deploy.yml after CI passes, so no git
  # repository is connected here: that would deploy every push a second time.
}

resource "vercel_project_environment_variable" "api_base_url" {
  project_id = vercel_project.web.id
  key        = "NEXT_PUBLIC_API_BASE_URL"
  value      = google_cloud_run_v2_service.api.uri
  target     = ["production", "preview"]
  sensitive  = false
  comment    = "Managed by Terraform; points at the Cloud Run API"
}

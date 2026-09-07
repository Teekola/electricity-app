.DEFAULT_GOAL := help

.PHONY: help
help: ## Show this help
	@grep -hE '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN { FS = ":.*?## " } { printf "  \033[36m%-13s\033[0m %s\n", $$1, $$2 }'

.PHONY: dev
dev: db-up ## Start the database, then every dev server on the host
	pnpm dev

.PHONY: check
check: db-up ## Run everything CI checks: lint, typecheck, tests and both builds
	pnpm turbo run lint typecheck test build

.PHONY: up
up: ## Run the full containerised stack: Postgres, Adminer and the API image
	docker compose up -d --build --wait

.PHONY: db-up
db-up: ## Start Postgres and Adminer only, waiting until the seed is queryable
	docker compose up -d --build --wait db adminer

.PHONY: e2e
e2e: db-up ## Run the Playwright suite against built artifacts and the seeded database
	pnpm turbo run e2e

.PHONY: e2e-setup
e2e-setup: ## Install the browser the E2E suite drives (once per machine; asks for sudo on Linux)
	pnpm --filter @repo/e2e e2e:install

.PHONY: down
down: ## Stop the containers, keeping the seeded volume
	docker compose down

.PHONY: db-down
db-down: down ## Alias for down

.PHONY: db-reset
db-reset: ## Drop the volume and re-seed from db/init-db.tar.gz
	docker compose down -v
	$(MAKE) db-up

.PHONY: db-migrate
db-migrate: ## Migrate and seed whatever DATABASE_URL points at (Compose seeds itself; Cloud SQL cannot)
	pnpm --filter @repo/api run db:deploy
	./scripts/seed-db.sh

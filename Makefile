.DEFAULT_GOAL := help

.PHONY: help
help: ## Show this help
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN { FS = ":.*?## " } { printf "  \033[36m%-8s\033[0m %s\n", $$1, $$2 }'

.PHONY: dev
dev: db-up ## Start the database, then every dev server
	pnpm dev

.PHONY: db-up
db-up: ## Start Postgres and Adminer, waiting until the seed is queryable
	docker compose up -d --build --wait

.PHONY: db-down
db-down: ## Stop the containers, keeping the seeded volume
	docker compose down

.PHONY: db-reset
db-reset: ## Drop the volume and re-seed from db/init-db.tar.gz
	docker compose down -v
	$(MAKE) db-up

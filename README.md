# Electricity Data

A web application presenting Finnish hourly electricity production, consumption and price data,
provided as a fixed historical dataset, as per-day statistics and per-day detail.

- **[RUNNING.md](RUNNING.md)** — how to install, run and test the project.
- **[DEPLOYING.md](DEPLOYING.md)** — the cloud setup, the Terraform stacks and the CI pipeline.
- **[ASSIGNMENT.md](ASSIGNMENT.md)** — the original assignment brief and the dataset's schema.
- **[CONTEXT.md](CONTEXT.md)** — the domain vocabulary this codebase and these docs use.

## Layout

pnpm workspaces with Turborepo.

|                         |                                                                 |
| ----------------------- | --------------------------------------------------------------- |
| `apps/web`              | Next.js, TypeScript, Tailwind, shadcn/ui                        |
| `apps/api`              | Fastify, TypeScript, Prisma over the seeded PostgreSQL database |
| `packages/api-contract` | the Zod schemas both sides of the HTTP boundary share           |
| `packages/e2e`          | the Playwright end-to-end suite                                 |

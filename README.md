# Electricity Data

A web application presenting Finnish hourly electricity production, consumption and price data, provided as a fixed historical dataset, as per-day statistics and per-day detail.

**Live at [electricity-app-six.vercel.app](https://electricity-app-six.vercel.app)** with the frontend on Vercel, the API on Google Cloud Run, and the database on Google Cloud SQL.

- **[RUNNING.md](RUNNING.md)** — how to install, run and test the project.
- **[DEPLOYING.md](DEPLOYING.md)** — the cloud setup, the Terraform stacks and the CI pipeline.
- **[REFLECTION.md](REFLECTION.md)** — the decisions behind the solution, and how I used AI.
- **[ASSIGNMENT.md](ASSIGNMENT.md)** — the original assignment brief and the dataset's schema.
- **[CONTEXT.md](CONTEXT.md)** — the domain vocabulary this codebase and these docs use.

## Features

**Daily statistics list**: total production, total consumption, average price and the longest consecutive run of negative-price hours, per day. Every date links to that day.

- **Pagination**, server-side, 25/50/100/200 rows per page.
- **Ordering** on every column, server-side, so a sort covers the whole dataset rather than the page on screen.
- **Filtering** by date range and by minimum/maximum on all four figures. This is also how searching works: the date-range picker and the measure filters are the search interface.
- Filters, sort and page live in the URL, so any view can be linked or reloaded.
- Days the dataset does not cover in full are flagged with the number of hours actually present, because their totals are not comparable to a full day's.

**Day detail**: the same four figures for one day, plus the hour whose consumption was the largest fraction of that hour's production and the day's cheapest hours, with an hourly production/consumption line chart and an hourly price bar chart.

**From the assignment's "surprise us with"**: the API runs in Docker, the whole stack runs in the cloud from Terraform, and a Playwright end-to-end suite runs in CI on every pull request, alongside unit tests and API integration tests that run against the real seeded database.

## Layout

pnpm workspaces with Turborepo.

|                              |                                                                 |
| ---------------------------- | --------------------------------------------------------------- |
| `apps/web`                   | Next.js, TypeScript, Tailwind, shadcn/ui                        |
| `apps/api`                   | Fastify, TypeScript, Prisma over the seeded PostgreSQL database |
| `packages/api-contract`      | the Zod schemas both sides of the HTTP boundary share           |
| `packages/e2e`               | the Playwright end-to-end suite                                 |
| `packages/eslint-config`     | the flat ESLint config every workspace extends                  |
| `packages/typescript-config` | the `tsconfig` bases, on `@tsconfig/strictest`                  |

## AI usage

I made the decisions, an AI agent wrote most of the code, and I reviewed and corrected the result. The workflow was based on **[the skills created by Matt Pocock](https://www.aihero.dev/skills)**. See more in **[REFLECTION.md](REFLECTION.md)**.

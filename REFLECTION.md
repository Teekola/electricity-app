# Reflection

This document covers the key decisions for the application, and explains how AI was used in the process.

## The dataset

I started by studying the data. It is a fixed historical set: 32,838 hourly data points covering 1,371 days from 2020-12-31 to 2024-10-01. Nothing in the application writes to it.

- **Consumption is only measured from 2023-08-01 onwards.** For the first two and a half years the column is empty, so a day's consumption total and every figure derived from it are absent rather than zero.
- **Not every day is 24 hours long.** Seven days fall on a clock change: four have 23 hours and three have 25. A day's length has to be derived rather than assumed, or elapsed time and hour counts both come out wrong on those days.
- **Not every day is complete.** Eleven days hold fewer data points than the day has hours. Their totals are not comparable to a full day's, so they cannot simply be listed alongside them.
- **Consumption never exceeds production anywhere in the dataset.** The assignment's "hour with most electricity consumption compared to production" therefore identifies the hour the production surplus was thinnest, not an hour of shortfall.

## Decisions

**A shared contract package.** `packages/api-contract` holds the Zod schemas for every endpoint, and both sides import them: the API registers its routes from that registry, and the web client parses each response with the schema it looks up by path. This is the reason the project is a monorepo. If I change the API's shape, the frontend stops compiling, so the two cannot drift apart silently.

**Prisma, with the queries written in SQL.** I chose Prisma because I like how `schema.prisma` documents the dataset in one file, and it handles the migrations. Its queries are parameterised, so it protects against SQL injection. The queries themselves are raw SQL, because the negative-price streak needs window functions and the query builder cannot do those. `$queryRaw` does not validate what it returns, so I parse each result with the contract schemas.

**The database does the work.** One aggregation lives in a CTE that both the list and the Day Detail select from, so a day cannot report different totals in the two views. It also handles the clock changes: each day's length comes from `AT TIME ZONE` arithmetic instead of being assumed to be 24 hours, hours become absolute instants so that 01:00 to 03:00 on a spring-forward day counts as one hour, and negative-price runs are partitioned by date so a run stops at midnight. The casts happen in SQL too, so no `Decimal`, `BigInt` or timezone-shifted `Date` ever reaches JSON.

**The data is presented as received.** Nothing is smoothed, corrected or hidden. Days the dataset does not cover in full are flagged with the number of hours actually present, because their totals are not comparable to a full day's. Ties are not broken arbitrarily either: hours the dataset prices identically are equally cheap, which is why the cheapest hours and the peak consumption ratio hours are plural.

**Sorting, filtering and pagination on the server.** The list is paginated, so sorting in the browser would only sort the page on screen. Doing it in the database means a sort covers every day in the dataset. All of that state lives in the URL, which means any view can be linked, reloaded or shared.

**Filtering instead of a search box.** The assignment lists searching as an optional feature, but the dataset holds no text beyond the date. The date-range picker covers dates better than a text field would, and a number is better looked up by the minimum and maximum filters on the four figures than by typing it into a box. A single search box over those five columns would have been a worse interface, so I did not build one.

**No form library.** I would normally reach for react-hook-form with `zodResolver`, but this form is one sheet of number inputs, submitted once. The applied filters live in the URL, each input holds only what the reader has typed so far, and the validation is already in the shared contract schema, which parses the query on both sides. That left the library too little to do to be worth the dependency.

**Caching, since the data never changes.** Every read is cached for the maximum lifetime. The dynamic parts sit behind Suspense with skeletons the size of the real content, so the layout paints immediately and nothing jumps when the figures arrive.

**Tests against the real thing.** The API tests query the seeded database rather than mocks, using fixture days each picked to exercise one domain case. The end-to-end suite drives production builds of both apps rather than dev servers, so it tests what actually ships.

**Deployment as code.** Terraform describes the Vercel project, the Cloud Run service and the Cloud SQL instance, with a bootstrap stack applied once by hand and everything else applied by CI. Vercel because deploying Next.js there is free and simple, and Google Cloud because it runs both the database and a containerised API on free credits.

## How I used AI

I built this with an agent throughout, following the workflow in [the skills created by Matt Pocock](https://www.aihero.dev/skills).

Every decision came out of a grilling session: I put my ideas to the agent and had it interrogate the trade-offs until they were explicit, and then chose.

The agent then wrote most of the code, against a harness that is checked into the repository: `CONTEXT.md` for the domain vocabulary, `docs/agents/coding-standards.md` for the standards it was held to, and `AGENTS.md` pointing at both. I reviewed the result each time. Some pieces took several rounds before they read the way I wanted, and some I edited directly.

## Scope, and what I would change

The dataset is public and read-only, so there is no authentication, and no rate limiting, though that could be added if the API ever saw real traffic. The caching assumes the data never changes, and some tests assert against specific seeded days, so both would need revisiting if it were being updated. Scaling would start at the database rather than the API, since every query in the application is a read and `db-f1-micro` is the smallest instance there is.

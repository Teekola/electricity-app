import "dotenv/config";

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    // prisma generate runs in the Docker build
    url: process.env["DATABASE_URL"] ?? "",
  },
});

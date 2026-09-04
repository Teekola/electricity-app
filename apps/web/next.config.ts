// Imported for its side effect: validates env vars
import "./lib/env";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
};

export default nextConfig;

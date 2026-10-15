import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  output: 'standalone',
  // Pinned to the monorepo root rather than inferred: Next guesses the root
  // from the topmost lockfile it finds, which a stray lockfile in a parent
  // directory would silently change.
  outputFileTracingRoot: fileURLToPath(new URL('../..', import.meta.url)),
  experimental: {
    // Requests rewritten to the backend give up after 30s.
    proxyTimeout: 30_000,
  },
};

export default nextConfig;

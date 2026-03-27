/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly set the Turbopack root to the current directory
  // This helps Next.js correctly resolve modules in monorepo-like setups.
  turbopack: { root: __dirname },
};
module.exports = nextConfig;
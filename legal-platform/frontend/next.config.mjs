// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   // Produces a minimal, self-contained server build (only the files
//   // actually needed at runtime, node_modules trimmed to what's used) —
//   // this is what the Dockerfile's runtime stage copies. Without this, the
//   // Docker image would need the full node_modules tree, which is much
//   // larger for no benefit in a containerized deployment.
//   output: "standalone",
// };

// export default nextConfig;


/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone build
  output: "standalone",

  // Ignore ESLint errors during production build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // (Optional) Agar TypeScript errors bhi aaye to ye bhi add kar do
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
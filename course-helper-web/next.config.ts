import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'out',
  basePath: '/NCHU_Course_Selector',
  assetPrefix: '/NCHU_Course_Selector',
  images: {
    unoptimized: true,
  },
  // 禁用 server-side features for static export
  experimental: {
    // esmExternals: false // this is the default in Next.js 13+
  }
};

export default nextConfig;

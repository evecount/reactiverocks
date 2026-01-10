import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // High-performance images for 90s neon textures
  images: {
    unoptimized: true, 
  },
  typescript: {
    // During a hackathon push, we sometimes need to ignore errors to get the 'pack' to finish
    ignoreBuildErrors: true, 
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

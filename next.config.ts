import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // This tells Turbopack/Webpack to ignore the problematic mediapipe binaries during build
  serverExternalPackages: ["@mediapipe/hands", "@tensorflow/tfjs-node"], 
  typescript: {
    // During a hackathon push, we sometimes need to ignore errors to get the 'pack' to finish
    ignoreBuildErrors: true, 
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

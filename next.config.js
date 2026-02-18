/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Required for Render / reverse proxy environments
    trustHostHeader: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'linktree13.s3.amazonaws.com',
      },
    ],
  },
};

module.exports = nextConfig;

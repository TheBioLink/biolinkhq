/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Render + proxy breaks Server Actions host validation
    serverActions: false,
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "linktree13.s3.amazonaws.com" },
    ],
  },
};

module.exports = nextConfig;

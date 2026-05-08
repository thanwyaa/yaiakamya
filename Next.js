// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['videotourl.com', 'firebasestorage.googleapis.com'],
    unoptimized: true
  },
  trailingSlash: true
}

module.exports = nextConfig

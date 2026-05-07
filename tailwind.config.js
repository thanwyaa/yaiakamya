/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  basePath: '/yalla-kimya', // غير هذا لاسم المستودع الخاص بك
  assetPrefix: '/yalla-kimya',
}

module.exports = nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack kapalı → Webpack açık (Vercel’de %100 çalışır)
  experimental: {
    turbopack: false,
  },
  // Ekstra stabilite
  webpack: (config) => {
    config.resolve.fallback = { 
      ...config.resolve.fallback, 
      fs: false 
    };
    return config;
  },
};

module.exports = nextConfig;
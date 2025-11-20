/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack kapalı (zorunlu)
  experimental: {
    turbopack: false,
  },

  // Test dosyalarını tamamen yok say
  webpack(config) {
    config.ignoreWarnings ||= [];
    config.ignoreWarnings.push({
      module: /node_modules/,
      message: /syntax-error|close-on-gc|tap/,
    });

    return config;
  },
};

export default nextConfig;
/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development';

const nextConfig = {
  // Separate build dir so `next build` never collides with a running `next dev` (.next)
  distDir: process.env.NEXT_DIST_DIR || '.next',

  // في وضع الإنتاج يتم التصدير السكوني الكامل للـ IIS، أما في وضع التطوير يتم تفعيل الوكيل (Proxy) لـ Express
  ...(isDev
    ? {
        async rewrites() {
          return [
            {
              source: '/api/:path*',
              destination: 'http://127.0.0.1:5000/api/:path*',
            },
          ];
        },
      }
    : {
        output: 'export',
      }),

  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
};

module.exports = nextConfig;

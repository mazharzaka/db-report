/** @type {import('next').NextConfig} */
const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

module.exports = (phase) => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    // في وضع التطوير (next dev) يتم استخدام المسارات الديناميكية والوكيل (rewrites)
    // وفي وضع الإنتاج (next build) يتم التصدير السكوني الكامل (output: 'export') للـ IIS
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
};

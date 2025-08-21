/** @type {import('next').NextConfig} */
const nextConfig = {
  // 실험적 기능들
  experimental: {
    appDir: true, // App Router 활성화
  },

  // 이미지 최적화 설정
  images: {
    domains: ["localhost"], // 허용할 이미지 도메인
    unoptimized: false,
  },

  // 환경변수 설정
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // API 라우트 설정
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*", // 백엔드 프록시
      },
    ];
  },

  // CORS 설정
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.mun09.acorn",
  appName: "acorn",
  webDir: "public",
  server: {
    // 개발용: 폰이 접속 가능한 LAN IP 사용
    url: "http://192.168.0.2:3000", // 예시
    cleartext: true, // http 쓸 때 필요
  },
};

export default config;

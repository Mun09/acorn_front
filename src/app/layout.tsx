import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { Sidebar } from "@/components/Sidebar";
// import { PopularSymbolsWidget } from "@/components/PopularSymbolsWidget";

// 폰트 설정
const inter = Inter({ subsets: ["latin"] });

// app/layout.tsx
import type { Metadata } from "next";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl), // ★ 중요: 절대경로 기준
  title: {
    default: "Acorn",
    template: "%s | Acorn",
  },
  description: "Modern social platform for financial discussions",
  keywords: ["social", "finance", "trading", "stocks", "crypto"],
  authors: [{ name: "Acorn Team" }],
  creator: "Acorn",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://acorn.example.com",
    title: "Acorn",
    description: "Modern social platform for financial discussions",
    siteName: "Acorn",
    images: ["/og/icon.png"], // ★ 여기 추가
  },
  twitter: {
    card: "summary_large_image",
    title: "Acorn",
    description: "Modern social platform for financial discussions",
    creator: "@acorn",
    images: ["/og/icon.png"], // ★ 여기 추가
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-background">
            <div className="flex">
              {/* 좌측 사이드바 */}
              <Sidebar />

              {/* 메인 컨텐츠 */}
              <main className="flex-1 min-h-screen lg:pl-64 lg:pr-80">
                <div className="container mx-auto px-4 py-6">{children}</div>
              </main>

              {/* 우측 사이드바 위젯 */}
              {/* <PopularSymbolsWidget /> */}
            </div>
          </div>

          {/* 모달, 토스트 등을 위한 포털 */}
          <div id="modal-root" />
          <div id="tooltip-root" />
        </Providers>
      </body>
    </html>
  );
}

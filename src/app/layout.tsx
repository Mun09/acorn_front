import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { Nav } from "@/components/Nav";
import { Sidebar } from "@/components/Sidebar";

// 폰트 설정
const inter = Inter({ subsets: ["latin"] });

// 메타데이터 설정
export const metadata: Metadata = {
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
  },
  twitter: {
    card: "summary_large_image",
    title: "Acorn",
    description: "Modern social platform for financial discussions",
    creator: "@acorn",
  },
  robots: {
    index: true,
    follow: true,
  },
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
            {/* 상단 네비게이션 */}
            <Nav />

            <div className="flex">
              {/* 좌측 사이드바 */}
              <Sidebar />

              {/* 메인 컨텐츠 */}
              <main className="flex-1 min-h-screen pt-16 lg:pl-64">
                <div className="container mx-auto px-4 py-6">{children}</div>
              </main>
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

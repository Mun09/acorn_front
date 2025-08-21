import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
    locale: "en_US",
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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* 전역 프로바이더들 */}
        <div id="root">{children}</div>
        {/* 모달, 토스트 등을 위한 포털 */}
        <div id="modal-root" />
        <div id="tooltip-root" />
      </body>
    </html>
  );
}

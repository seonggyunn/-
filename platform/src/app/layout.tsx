import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "한칸 운영실 | 소상공인 온라인 관리",
    template: "%s | 한칸 운영실",
  },
  description:
    "네이버 플레이스, 구글 지도, 홈페이지 정보 관리와 승인 기반 작업 보고. 무료 온라인 정보 진단을 신청하세요.",
  robots: { index: true, follow: true },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

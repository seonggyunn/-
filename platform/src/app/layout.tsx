import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "한칸데이터 | 식당 네이버 플레이스 개선·운영",
    template: "%s | 한칸데이터",
  },
  description:
    "동네 개인 식당의 강점을 소개·메뉴·사진·이용 안내로 정리합니다. 네이버 플레이스 무료 간단 진단부터 승인 기반 적용 지원까지.",
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

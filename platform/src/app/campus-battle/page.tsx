import type { Metadata } from "next";
import CampusBattle from "./CampusBattle";
import "./battle.css";
export const metadata: Metadata = {
  title: "학과 공싸움 | 랜덤 학과 대결",
  description:
    "우리 과 vs 친구 과. 두 개의 공이 부딪히는 랜덤 대결! 학과를 고르고 친구와 결과를 공유해보세요.",
};
export default function Page() {
  return <CampusBattle />;
}

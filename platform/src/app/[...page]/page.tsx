import Public from "../../components/Public";
import { pages } from "../../content";
import Admin from "../../components/Admin";
import { notFound } from "next/navigation";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string[] }>;
}) {
  const { page } = await params;
  return {
    title:
      pages[page[0]] ||
      (page[0] === "admin" ? "운영자 워크스페이스" : "페이지 없음"),
    robots: page[0] === "admin" ? { index: false, follow: false } : undefined,
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ page: string[] }>;
}) {
  const { page } = await params;
  if (page[0] === "admin") return <Admin path={page} />;
  if (page.length !== 1 || !pages[page[0]]) notFound();
  return <Public page={page[0]} />;
}

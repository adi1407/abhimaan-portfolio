import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkPage } from "@/features/work";
import { isWorkCategoryId } from "@/lib/work";

type Props = {
  params: Promise<{ category: string }>;
};

export function generateStaticParams() {
  return [
    { category: "posters" },
    { category: "thumbnails" },
    { category: "logos" },
    { category: "books" },
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  if (!isWorkCategoryId(category)) return { title: "Work" };
  return { title: `${category} — Work` };
}

export default async function WorkCategoryRoute({ params }: Props) {
  const { category } = await params;
  if (!isWorkCategoryId(category)) notFound();

  return (
    <main className="flex flex-1 flex-col">
      <WorkPage initialCategory={category} />
    </main>
  );
}

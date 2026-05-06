import type { Metadata } from "next";
import HomepageContent from "@/components/HomepageContent";

export const metadata: Metadata = {
  title: "ForageWise — Home",
  description:
    "Offline-first field app for mushroom, plant, tree, park, trail, and expedition discovery in Tennessee.",
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col px-4 py-6 max-w-lg mx-auto pb-28">
      <HomepageContent />
    </main>
  );
}

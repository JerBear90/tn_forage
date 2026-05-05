import type { Metadata } from "next";
import ProfileContent from "./ProfileContent";

export const metadata: Metadata = {
  title: "Profile — ForageWise",
  description:
    "Manage your ForageWise profile, settings, and membership.",
};

export default function ProfilePage() {
  return <ProfileContent />;
}

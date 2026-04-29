import type { Metadata } from "next";
import ProfileContent from "./ProfileContent";

export const metadata: Metadata = {
  title: "Profile — ForageFlow",
  description:
    "Manage your ForageFlow profile, settings, and membership.",
};

export default function ProfilePage() {
  return <ProfileContent />;
}

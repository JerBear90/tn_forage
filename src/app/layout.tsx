import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "@/styles/globals.css";
import BottomNav from "@/components/BottomNav";
import ThemeProvider from "@/components/ThemeProvider";
import PwaSplash from "@/components/PwaSplash";
import LogoIntro from "@/components/LogoIntro";
import AppShell from "@/layouts/AppShell";
import AuthProvider from "@/auth/AuthProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ForageFlow",
  description:
    "Offline-first field app for mushroom, plant, tree, park, trail, and expedition discovery in Tennessee.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ForageFlow",
    startupImage: [
      // iPhone SE / 8 (750x1334 @2x)
      {
        url: "/branding/app-icon.svg",
        media:
          "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
      // iPhone X / XS / 11 Pro (1125x2436 @3x)
      {
        url: "/branding/app-icon.svg",
        media:
          "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone XR / 11 (828x1792 @2x)
      {
        url: "/branding/app-icon.svg",
        media:
          "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)",
      },
      // iPhone 12 / 13 / 14 (1170x2532 @3x)
      {
        url: "/branding/app-icon.svg",
        media:
          "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 14 Pro / 15 (1179x2556 @3x)
      {
        url: "/branding/app-icon.svg",
        media:
          "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 14 Pro Max / 15 Plus (1290x2796 @3x)
      {
        url: "/branding/app-icon.svg",
        media:
          "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPad (1536x2048 @2x)
      {
        url: "/branding/app-icon.svg",
        media:
          "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)",
      },
      // iPad Pro 11" (1668x2388 @2x)
      {
        url: "/branding/app-icon.svg",
        media:
          "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)",
      },
      // iPad Pro 12.9" (2048x2732 @2x)
      {
        url: "/branding/app-icon.svg",
        media:
          "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { url: "/branding/app-icon.svg", type: "image/svg+xml", rel: "icon" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0F766E",
};

/**
 * Inline script that runs before React hydrates to prevent flash of wrong theme.
 * Reads localStorage and applies the "dark" class on <html> immediately.
 */
const themeInitScript = `
(function(){
  try {
    var t = localStorage.getItem("forageflow-theme");
    if (t === "dark" || (!t && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
    }
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased min-h-screen bg-brand-sand text-brand-charcoal font-sans dark:bg-dark-surface dark:text-dark-text pb-20">
        <ThemeProvider>
          <AuthProvider>
            <LogoIntro />
            <PwaSplash />
            <AppShell>{children}</AppShell>
            <BottomNav />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

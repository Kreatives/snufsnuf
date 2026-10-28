import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/session";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Snufsnuf — boeken voor dierenzorg",
  description:
    "De boekingslaag voor dierenzorg in Nederland. Gematcht op wat je dier nodig heeft, niet op wie bovenaan staat.",
  icons: { icon: "/brand/icon-green.svg" },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  return (
    <html lang="nl" className={`${interTight.variable} h-full`}>
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/gor7ynm.css" />
      </head>
      <body className="min-h-full flex flex-col">
        <SiteHeader user={user} />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}

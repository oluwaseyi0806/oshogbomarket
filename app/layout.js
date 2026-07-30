import "./globals.css";
import Script from "next/script";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BottomNav from "../components/BottomNav";
import OneSignalInit from "../components/OneSignalInit";
import PresenceTracker from "../components/PresenceTracker";
import IdleLogout from "../components/IdleLogout";
import SupportWidget from "../components/SupportWidget";
import { Analytics } from "@vercel/analytics/react";



export const metadata = {
  title: "OshogboMarket - Buy and sell in Osogbo",
  description: "Post what you want to buy, or list what you are selling - for Osogbo people, by Osogbo people.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-body min-h-screen flex flex-col">
        <Script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" strategy="afterInteractive" />
        <OneSignalInit />
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-6 flex-1 w-full pb-20">{children}</main>
        <Footer />
        <SupportWidget />
        <Analytics />
        <BottomNav />
      </body>
    </html>
  );
}
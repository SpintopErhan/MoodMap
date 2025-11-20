import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientProvider from "./ClientProvider"; // biraz sonra oluşturacağız

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MoodMap",
  description: "Share your daily mood on the global map",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0f0f23] text-white`}>
        <ClientProvider>{children}</ClientProvider>
      </body>
    </html>
  );
}
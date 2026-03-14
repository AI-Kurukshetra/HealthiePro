import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Healthie",
  description: "Digital health platform built with Next.js + Supabase"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

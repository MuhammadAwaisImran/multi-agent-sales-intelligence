import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "B2B Pitch Agent",
  description: "AI-powered B2B client pitch and lead enrichment agent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

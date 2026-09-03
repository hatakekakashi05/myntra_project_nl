import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Myntra Wishlist Discovery Engine",
  description: "AI-powered evidence discovery engine for Wishlist → Purchase conversion research",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

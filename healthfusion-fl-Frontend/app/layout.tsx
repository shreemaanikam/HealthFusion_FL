import type { Metadata } from "next";
// Self-hosted (no build-time network fetch to Google Fonts -- see
// globals.css for why this replaced next/font/google). Import order
// matters: base weight first, then the rest.
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "HealthFusion_FL — Explainable Adaptive Federated Healthcare Intelligence",
  description:
    "Privacy-preserving clinical intelligence for distributed healthcare environments.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-body">{children}</body>
    </html>
  );
}

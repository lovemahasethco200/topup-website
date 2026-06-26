import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TopupCenter | Fast Gaming Topup in Nepal",
  description:
    "Professional game topup platform for Free Fire, PUBG Mobile, Mobile Legends and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="bg-slate-950 text-white antialiased">{children}</body>
    </html>
  );
}
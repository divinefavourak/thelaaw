import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TheLaaw — Your Legal Rights Companion",
  description:
    "A Claude-powered multi-agent legal assistant for everyday Nigerians. Get plain-language answers about your rights, jurisdiction-aware statute research, and professionally drafted letters in Pidgin, Yoruba, or English.",
  keywords: ["legal rights Nigeria", "Nigerian law AI", "Lagos tenancy law", "legal aid Nigeria"],
  openGraph: {
    title: "TheLaaw",
    description: "AI-powered legal rights assistant for Nigerians.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}

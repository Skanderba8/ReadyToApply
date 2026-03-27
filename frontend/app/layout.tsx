import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ReadyToApply — Your CV, tailored in seconds.",
  description:
    "Upload your LinkedIn profile, paste a job description, get a tailored ATS-clean CV in seconds.",
  openGraph: {
    title: "ReadyToApply",
    description: "Your CV, tailored in seconds.",
    type: "website",
  },
    icons: {
    icon: "/logo.png",       // tab favicon
    shortcut: "/logo.png",   // browser shortcut
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body className="min-h-dvh bg-[#111111] text-[#F5F0EB] antialiased"
        style={{ fontFamily: "var(--font-body)" }}>
        {children}
      </body>
    </html>
  );
}
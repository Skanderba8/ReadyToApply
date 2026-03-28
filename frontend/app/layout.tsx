import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/lib/i18n";
import NavBar from "@/components/NavBar";

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
  metadataBase: new URL('https://readytoapply.work'), // Absolute base for all links
  title: "ReadyToApply — Your CV, tailored in seconds.",
  description: "Upload your LinkedIn profile, paste a job description, and get a tailored ATS-clean CV in seconds. The ultimate job application automation tool.",
  alternates: {
    canonical: '/', // Tells Google THIS is the master URL
  },
  openGraph: {
    title: "ReadyToApply",
    description: "Automate your job applications with ATS-friendly CVs.",
    url: 'https://readytoapply.work',
    siteName: 'ReadyToApply',
    images: [
      {
        url: '/og-image.png', // Add an image at public/og-image.png for LinkedIn/Twitter previews
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ReadyToApply',
    description: 'Tailored ATS-clean CVs in seconds.',
  },
  robots: {
    index: true,
    follow: true,
  },
  keywords: ["ATS resume", "job application automation", "LinkedIn to CV", "resume builder", "ReadyToApply"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body className="min-h-dvh bg-[#111111] text-[#F5F0EB] antialiased"
        style={{ fontFamily: "var(--font-body)" }}>
        <LangProvider>
          <NavBar />
          {children}
        </LangProvider>
      </body>
    </html>
  );
}

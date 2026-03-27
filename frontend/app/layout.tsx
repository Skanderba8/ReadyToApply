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
    icon: "/favicon.ico",       // tab favicon
    shortcut: "/favicon.ico",   // browser shortcut
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
        {/* GitHub badge — fixed bottom right */}
        <a
          href="https://github.com/Skanderba8/ReadyToApply"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-3 py-2 bg-[#1C1C1C] border border-[#2E2E2E] hover:border-[#FF4D00] transition-colors duration-200 group"
          aria-label="View source on GitHub"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"
            className="text-[#9A9A9A] group-hover:text-[#F5F0EB] transition-colors">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          <span className="text-xs text-[#9A9A9A] group-hover:text-[#F5F0EB] transition-colors"
            style={{ fontFamily: "var(--font-display)" }}>
            by Skander
          </span>
        </a>
      </body>
    </html>
  );
}
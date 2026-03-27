"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";

const GithubIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

export default function NavBar() {
  const { lang, setLang, u } = useLang();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 pointer-events-none">
      {/* Left — logo + name */}
      <Link href="/"
        className="pointer-events-auto flex items-center gap-2 text-sm font-bold text-[#F5F0EB] hover:text-[#FF4D00] transition-colors"
        style={{ fontFamily: "var(--font-display)" }}>
        <img src="/logo.png" alt="" width={20} height={20} aria-hidden="true" />
        ReadyToApply
      </Link>

      {/* Right — lang toggle + GitHub */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          onClick={() => setLang(lang === "en" ? "fr" : "en")}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1C1C] border border-[#2E2E2E] hover:border-[#FF4D00] text-xs transition-colors duration-200"
          style={{ fontFamily: "var(--font-display)" }}
          aria-label="Toggle language">
          <span className={lang === "en" ? "text-[#FF4D00]" : "text-[#9A9A9A]"}>EN</span>
          <span className="text-[#2E2E2E]">/</span>
          <span className={lang === "fr" ? "text-[#FF4D00]" : "text-[#9A9A9A]"}>FR</span>
        </button>

        <a
          href="https://github.com/Skanderba8/ReadyToApply"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 bg-[#1C1C1C] border border-[#FF4D00] text-[#9A9A9A] hover:text-[#F5F0EB] transition-colors duration-200"
          aria-label="View source on GitHub"
          style={{ fontFamily: "var(--font-display)" }}>
          <GithubIcon />
          <span className="text-xs">{u("bySkander")}</span>
        </a>
      </div>
    </div>
  );
}

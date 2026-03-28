"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, FileText, Zap, Download } from "lucide-react";
import { useLang } from "@/lib/i18n";

export default function LandingPage() {
  const { u } = useLang();

  return (
    <main className="min-h-dvh bg-[#111111] text-[#F5F0EB] overflow-hidden">

      <nav className="flex items-center justify-end px-6 md:px-12 py-6 pt-16">
        <Link href="/build"
          className="text-sm text-[#9A9A9A] hover:text-[#F5F0EB] transition-colors duration-200">
          {u("launchApp")}
        </Link>
      </nav>

      <section className="relative px-6 md:px-12 pt-16 md:pt-24 pb-24 md:pb-32">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-10 pointer-events-none"
          style={{ border: "1px solid #FF4D00", transform: "translate(30%, -30%)" }} aria-hidden="true" />
        <div className="absolute top-0 right-0 w-[350px] h-[350px] rounded-full opacity-10 pointer-events-none"
          style={{ border: "1px solid #FF4D00", transform: "translate(30%, -30%)" }} aria-hidden="true" />
        <div className="absolute bottom-0 left-0 opacity-20 pointer-events-none"
          style={{ width: "200px", height: "200px",
            backgroundImage: "radial-gradient(circle, #FF4D00 1px, transparent 1px)",
            backgroundSize: "20px 20px" }} aria-hidden="true" />

        <div className="relative max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-8 animate-fade-up">
            <div className="w-1.5 h-1.5 rounded-full bg-[#FF4D00]" aria-hidden="true" />
            <span className="text-xs uppercase tracking-widest text-[#9A9A9A]">{u("heroLabel")}</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-none tracking-tight mb-6 animate-fade-up delay-100"
            style={{ fontFamily: "var(--font-display)" }}>
            {u("heroTitle1")}<br />
            <span style={{ color: "var(--color-flame)" }}>{u("heroTitle2")}</span><br />
            {u("heroTitle3")}
          </h1>

          <p className="text-lg md:text-xl text-[#9A9A9A] max-w-xl mb-12 leading-relaxed animate-fade-up delay-200">
            {u("heroSub")}
          </p>

          <div className="animate-fade-up delay-300">
            <Link href="/build"
              className="group inline-flex items-center gap-3 px-8 py-4 text-base font-semibold text-[#111111] bg-[#FF4D00] hover:bg-[#FF8C42] transition-colors duration-200 rounded-none"
              style={{ fontFamily: "var(--font-body)" }}>
              {u("buildMyCv")}
              <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <div className="px-6 md:px-12"><div className="max-w-5xl mx-auto h-px bg-[#2E2E2E]" /></div>

      <section className="px-6 md:px-12 py-24">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-[#9A9A9A] mb-12"
            style={{ fontFamily: "var(--font-display)" }}>{u("howItWorks")}</p>

          <ol className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#2E2E2E]">
            {[
              { icon: FileText, step: "01", titleKey: "step1Title", bodyKey: "step1Body" },
              { icon: Zap,      step: "02", titleKey: "step2Title", bodyKey: "step2Body" },
              { icon: Download, step: "03", titleKey: "step3Title", bodyKey: "step3Body" },
            ].map(({ icon: Icon, step, titleKey, bodyKey }) => (
              <li key={step} className="bg-[#111111] p-8 md:p-10 flex flex-col gap-6">
                <div className="flex items-start justify-between">
                  <Icon size={24} style={{ color: "var(--color-flame)" }} aria-hidden="true" />
                  <span className="text-xs text-[#2E2E2E] font-bold" style={{ fontFamily: "var(--font-display)" }}>{step}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2 text-[#F5F0EB]" style={{ fontFamily: "var(--font-display)" }}>{u(titleKey)}</h3>
                  <p className="text-sm text-[#9A9A9A] leading-relaxed">{u(bodyKey)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="px-6 md:px-12"><div className="max-w-5xl mx-auto h-px bg-[#2E2E2E]" /></div>

      <section className="px-6 md:px-12 py-24">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <h2 className="text-3xl md:text-4xl font-bold leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            {u("readyToApply")}
          </h2>
          <Link href="/build"
            className="group inline-flex items-center gap-3 px-8 py-4 text-base font-semibold text-[#F5F0EB] border border-[#FF4D00] hover:bg-[#FF4D00] hover:text-[#111111] transition-all duration-200 rounded-none w-fit"
            style={{ fontFamily: "var(--font-body)" }}>
            {u("getStarted")}
            <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <footer className="px-6 md:px-12 py-8 border-t border-[#2E2E2E]">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-bold" style={{ fontFamily: "var(--font-display)" }}>
            <Image src="/logo.png" alt="" width={18} height={18} aria-hidden="true" />
            ReadyToApply
          </span>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-[#9A9A9A]">{u("noDataStored")}</span>
            <span className="text-xs text-[#444444]">
              {u("madeBy")}{" "}
              <a href="https://github.com/Skanderba8/ReadyToApply" target="_blank" rel="noopener noreferrer"
                className="text-[#555555] hover:text-[#FF4D00] transition-colors">
                Skander Ben Abdallah
              </a>
              {" "}· {u("mitLicense")}
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}

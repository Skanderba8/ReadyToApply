"use client";

import { useState } from "react";
import StepIndicator from "@/components/StepIndicator";
import StepProfile from "@/components/StepProfile";
import StepJob from "@/components/StepJob";
import StepReview from "@/components/StepReview";
import StepTemplate from "@/components/StepTemplate";
import StepDownload from "@/components/StepDownload";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CVData, Keywords } from "@/lib/api";

export default function BuildPage() {
  const [step, setStep] = useState(1);

  // Step 1 — profile
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");

  // Step 2 — job
  const [jobDescription, setJobDescription] = useState("");

  // Step 3 — review (populated after /extract call)
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [keywords, setKeywords] = useState<Keywords | null>(null);

  // Step 4 — template + download
  const [template, setTemplate] = useState("classic");

  const next = () => setStep((s) => Math.min(s + 1, 5));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <main className="min-h-dvh bg-[#111111] text-[#F5F0EB]">

      {/* ─── Nav ─────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-6 border-b border-[#2E2E2E]">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-[#9A9A9A] hover:text-[#F5F0EB] transition-colors"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span style={{ fontFamily: "var(--font-display)" }}>ReadyToApply</span>
        </Link>
        <span
          className="text-xs text-[#9A9A9A] hidden sm:block"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}
        >
          No data stored. Ever.
        </span>
      </nav>

      {/* ─── Content ─────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-6 md:px-12 py-12 md:py-20">

        {/* Step indicator — 5 steps now */}
        <div className="mb-12">
          <StepIndicator currentStep={step} totalSteps={5} />
        </div>

        {/* Steps */}
        {step === 1 && (
          <StepProfile
            file={file}
            pastedText={pastedText}
            onFileChange={setFile}
            onPastedTextChange={setPastedText}
            onNext={next}
          />
        )}

        {step === 2 && (
          <StepJob
            jobDescription={jobDescription}
            onJobDescriptionChange={setJobDescription}
            onNext={next}
            onBack={back}
          />
        )}

        {/* Step 3 — AI extraction + review/edit */}
        {step === 3 && (
          <StepReview
            file={file}
            pastedText={pastedText}
            jobDescription={jobDescription}
            onNext={(cv, kw) => {
              setCvData(cv);
              setKeywords(kw);
              next();
            }}
            onBack={back}
          />
        )}

        {/* Step 4 — template picker */}
        {step === 4 && (
          <StepTemplate
            selectedTemplate={template}
            onTemplateChange={setTemplate}
            onNext={next}
            onBack={back}
          />
        )}

        {/* Step 5 — generate + download */}
        {step === 5 && cvData && (
          <StepDownload
            cvData={cvData}
            jobDescription={jobDescription}
            template={template}
            keywords={keywords}
            onBack={back}
          />
        )}
      </div>
    </main>
  );
}
"use client";

import { useState } from "react";
import StepIndicator from "@/components/StepIndicator";
import StepProfile from "@/components/StepProfile";
import StepJob from "@/components/StepJob";
import StepReview from "@/components/StepReview";
import StepTemplate from "@/components/StepTemplate";
import StepDownload from "@/components/StepDownload";
import Link from "next/link";
import { useLang } from "@/lib/i18n";
import { CVData, Keywords } from "@/lib/api";

export default function BuildPage() {
  const { u } = useLang();
  const [step, setStep] = useState(1);

  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [keywords, setKeywords] = useState<Keywords | null>(null);
  const [template, setTemplate] = useState("classic");

  const next = () => setStep(s => Math.min(s + 1, 5));
  const back = () => setStep(s => Math.max(s - 1, 1));

  // Full restart — clear everything and go to step 1
  const restart = () => {
    setFile(null);
    setPastedText("");
    setJobDescription("");
    setCvData(null);
    setKeywords(null);
    setTemplate("classic");
    setStep(1);
  };

  return (
    <main className="min-h-dvh bg-[#111111] text-[#F5F0EB]">
      {/* Sub-nav — just the "no data" note; logo is in NavBar */}
      <div className="flex items-center justify-end px-6 md:px-12 py-4 pt-14 border-b border-[#2E2E2E]">
        <span className="text-xs text-[#9A9A9A] hidden sm:block"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}>
          {u("noDataStored")}
        </span>
      </div>

      <div className="max-w-2xl mx-auto px-6 md:px-12 py-12 md:py-20">
        <div className="mb-12">
          <StepIndicator currentStep={step} totalSteps={5} />
        </div>

        {step === 1 && (
          <StepProfile file={file} pastedText={pastedText}
            onFileChange={setFile} onPastedTextChange={setPastedText} onNext={next} />
        )}

        {step === 2 && (
          <StepJob jobDescription={jobDescription}
            onJobDescriptionChange={setJobDescription} onNext={next} onBack={back} />
        )}

        {step === 3 && (
          <StepReview file={file} pastedText={pastedText} jobDescription={jobDescription}
            initialCv={cvData}
            initialKeywords={keywords}
            onNext={(cv, kw) => { setCvData(cv); setKeywords(kw); next(); }}
            onBack={back} />
        )}

        {/* Step 4 — template picker; "Continue" is now "Generate CV" */}
        {step === 4 && (
          <StepTemplate selectedTemplate={template} onTemplateChange={setTemplate}
            onNext={next} onBack={back} />
        )}

        {/* Step 5 — auto-generates on mount */}
        {step === 5 && cvData && (
          <StepDownload cvData={cvData} jobDescription={jobDescription}
            template={template} keywords={keywords}
            onRestart={restart}
            onEdit={() => setStep(3)}
            onBack={back} />
        )}
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useLang, detectJobLang } from "@/lib/i18n";

interface StepJobProps {
  jobDescription: string;
  onJobDescriptionChange: (text: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepJob({ jobDescription, onJobDescriptionChange, onNext, onBack }: StepJobProps) {
  const { u, setLang } = useLang();
  const [error, setError] = useState("");

  const handleChange = (text: string) => {
    onJobDescriptionChange(text);
    // Auto-detect language when enough text is present
    if (text.length > 80) {
      setLang(detectJobLang(text));
    }
  };

  const handleNext = () => {
    if (jobDescription.trim().length < 50) { setError(u("errorJob")); return; }
    setError("");
    onNext();
  };

  return (
    <div className="animate-fade-up">
      <h2 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>{u("theRole")}</h2>
      <p className="text-[#9A9A9A] mb-8 text-sm">{u("roleSub")}</p>

      <div className="relative">
        <textarea value={jobDescription} onChange={(e) => handleChange(e.target.value)}
          placeholder={u("jobPlaceholder")} rows={14}
          className="w-full bg-[#1C1C1C] border border-[#2E2E2E] text-[#F5F0EB] text-sm p-4 resize-none focus:outline-none focus:border-[#FF4D00] transition-colors duration-200 placeholder:text-[#9A9A9A]"
          style={{ fontFamily: "var(--font-body)" }} />
        <div className="absolute bottom-3 right-4 text-xs text-[#9A9A9A]">{jobDescription.length} chars</div>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <div className="mt-8 flex items-center gap-4">
        <button onClick={onBack}
          className="px-6 py-4 text-sm text-[#9A9A9A] hover:text-[#F5F0EB] transition-colors border border-[#2E2E2E] hover:border-[#9A9A9A]"
          style={{ fontFamily: "var(--font-body)" }}>
          {u("back")}
        </button>
        <button onClick={handleNext}
          className="group inline-flex items-center gap-3 px-8 py-4 text-sm font-semibold text-[#111111] bg-[#FF4D00] hover:bg-[#FF8C42] transition-colors duration-200"
          style={{ fontFamily: "var(--font-body)" }}>
          {u("continue")}
          <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
        </button>
      </div>
    </div>
  );
}

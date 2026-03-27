"use client";

import { useState } from "react";
import { Download, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { generateCV, downloadBlob, CVData, Keywords } from "@/lib/api";

interface StepDownloadProps {
  cvData: CVData;
  jobDescription: string;
  template: string;
  keywords: Keywords | null;
  onBack: () => void;
}

type Status = "idle" | "generating" | "done" | "error";

export default function StepDownload({
  cvData, jobDescription, template, keywords, onBack,
}: StepDownloadProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [docxBlob, setDocxBlob] = useState<Blob | null>(null);

  const safeName = cvData.name.replace(/\s+/g, "_").replace(/\//g, "_");

  const handleGenerate = async () => {
    setDocxBlob(null);
    setErrorMessage("");
    setStatus("generating");
    try {
      const blob = await generateCV(cvData, jobDescription, template, keywords ?? undefined);
      setDocxBlob(blob);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const handleDownload = () => {
    if (docxBlob) downloadBlob(docxBlob, `CV_${safeName}.docx`);
  };

  return (
    <div className="animate-fade-up">
      <h2 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
        Generate your CV
      </h2>
      <p className="text-[#9A9A9A] mb-10 text-sm">
        One final AI pass to tailor your CV to the job. Takes about 10 seconds.
      </p>

      {status === "idle" && (
        <div className="space-y-4">
          <button onClick={handleGenerate}
            className="group inline-flex items-center gap-3 px-8 py-4 text-sm font-semibold text-[#111111] bg-[#FF4D00] hover:bg-[#FF8C42] transition-colors duration-200"
            style={{ fontFamily: "var(--font-body)" }}>
            Generate CV
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </button>
          <div>
            <button onClick={onBack}
              className="px-6 py-4 text-sm text-[#9A9A9A] hover:text-[#F5F0EB] transition-colors border border-[#2E2E2E] hover:border-[#9A9A9A]"
              style={{ fontFamily: "var(--font-body)" }}>
              ← Back
            </button>
          </div>
        </div>
      )}

      {status === "generating" && (
        <div className="flex items-center gap-4 px-8 py-4 border border-[#2E2E2E]">
          <RefreshCw size={16} className="animate-spin" style={{ color: "#FF4D00" }} aria-hidden="true" />
          <span className="text-sm text-[#F5F0EB] animate-pulse" style={{ fontFamily: "var(--font-body)" }}>
            Tailoring your CV to the job…
          </span>
        </div>
      )}

      {status === "done" && docxBlob && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 border border-[#2E2E2E]">
            <CheckCircle size={18} style={{ color: "#FF4D00" }} aria-hidden="true" />
            <span className="text-sm text-[#F5F0EB]">CV_{safeName}.docx</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={handleDownload}
              className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[#111111] bg-[#FF4D00] hover:bg-[#FF8C42] transition-colors duration-200"
              style={{ fontFamily: "var(--font-body)" }}>
              <Download size={15} aria-hidden="true" />
              Download .docx
            </button>
            <button onClick={handleGenerate}
              className="px-6 py-3 text-sm text-[#9A9A9A] hover:text-[#F5F0EB] transition-colors border border-[#2E2E2E] hover:border-[#9A9A9A]"
              style={{ fontFamily: "var(--font-body)" }}>
              Regenerate
            </button>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 border border-red-900 bg-red-950/30">
            <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-red-400 mb-1">Generation failed</p>
              <p className="text-xs text-red-400/70">{errorMessage}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleGenerate}
              className="group inline-flex items-center gap-3 px-8 py-4 text-sm font-semibold text-[#111111] bg-[#FF4D00] hover:bg-[#FF8C42] transition-colors duration-200"
              style={{ fontFamily: "var(--font-body)" }}>
              Try again →
            </button>
            <button onClick={onBack}
              className="px-6 py-4 text-sm text-[#9A9A9A] hover:text-[#F5F0EB] transition-colors border border-[#2E2E2E] hover:border-[#9A9A9A]"
              style={{ fontFamily: "var(--font-body)" }}>
              ← Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

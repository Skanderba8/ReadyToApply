"use client";

import { useState } from "react";
import { Download, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { generateCV, downloadBlob } from "@/lib/api";

interface StepDownloadProps {
  file: File | null;
  pastedText: string;
  jobDescription: string;
  template: string;
  onBack: () => void;
}

type Status = "idle" | "extracting" | "writing" | "tailoring" | "done" | "error";

const STATUS_MESSAGES: Record<Status, string> = {
  idle: "",
  extracting: "Extracting your profile...",
  writing: "Writing your CV...",
  tailoring: "Tailoring to the job...",
  done: "Your CV is ready.",
  error: "",
};

export default function StepDownload({
  file,
  pastedText,
  jobDescription,
  template,
  onBack,
}: StepDownloadProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [cvBlob, setCvBlob] = useState<Blob | null>(null);

  const handleGenerate = async () => {
    setCvBlob(null);
    setErrorMessage("");

    // Cycle through status messages to give feedback during the AI calls
    setStatus("extracting");
    const t1 = setTimeout(() => setStatus("writing"), 6000);
    const t2 = setTimeout(() => setStatus("tailoring"), 14000);

    try {
      const blob = await generateCV(file, pastedText, jobDescription, template);
      clearTimeout(t1);
      clearTimeout(t2);
      setCvBlob(blob);
      setStatus("done");
    } catch (err) {
      clearTimeout(t1);
      clearTimeout(t2);
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const handleDownload = () => {
    if (cvBlob) downloadBlob(cvBlob, "ReadyToApply_CV.docx");
  };

  const isLoading = ["extracting", "writing", "tailoring"].includes(status);

  return (
    <div className="animate-fade-up">
      <h2
        className="text-3xl md:text-4xl font-bold mb-2"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Generate your CV
      </h2>
      <p className="text-[#9A9A9A] mb-10 text-sm">
        Three AI passes — extract, write, tailor. Takes about 20 seconds.
      </p>

      {/* Idle state */}
      {status === "idle" && (
        <button
          onClick={handleGenerate}
          className="group inline-flex items-center gap-3 px-8 py-4 text-sm font-semibold text-[#111111] bg-[#FF4D00] hover:bg-[#FF8C42] transition-colors duration-200"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Generate CV
          <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
        </button>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center gap-4 px-8 py-4 border border-[#2E2E2E]">
          <RefreshCw
            size={16}
            className="animate-spin"
            style={{ color: "#FF4D00" }}
            aria-hidden="true"
          />
          <span
            className="text-sm text-[#F5F0EB] animate-pulse-flame"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {STATUS_MESSAGES[status]}
          </span>
        </div>
      )}

      {/* Success state */}
      {status === "done" && cvBlob && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 border border-[#2E2E2E]">
            <CheckCircle size={18} style={{ color: "#FF4D00" }} aria-hidden="true" />
            <span className="text-sm text-[#F5F0EB]">ReadyToApply_CV.docx</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleDownload}
              className="group inline-flex items-center gap-3 px-8 py-4 text-sm font-semibold text-[#111111] bg-[#FF4D00] hover:bg-[#FF8C42] transition-colors duration-200"
              style={{ fontFamily: "var(--font-body)" }}
            >
              <Download size={16} aria-hidden="true" />
              Download CV
            </button>
            <button
              onClick={handleGenerate}
              className="px-6 py-4 text-sm text-[#9A9A9A] hover:text-[#F5F0EB] transition-colors border border-[#2E2E2E] hover:border-[#9A9A9A]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Regenerate
            </button>
          </div>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 border border-red-900 bg-red-950/30">
            <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-red-400 mb-1">Generation failed</p>
              <p className="text-xs text-red-400/70">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            className="group inline-flex items-center gap-3 px-8 py-4 text-sm font-semibold text-[#111111] bg-[#FF4D00] hover:bg-[#FF8C42] transition-colors duration-200"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Try again
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </button>
        </div>
      )}

      {/* Back button — only show before generation starts */}
      {status === "idle" && (
        <div className="mt-6">
          <button
            onClick={onBack}
            className="px-6 py-4 text-sm text-[#9A9A9A] hover:text-[#F5F0EB] transition-colors border border-[#2E2E2E] hover:border-[#9A9A9A]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}
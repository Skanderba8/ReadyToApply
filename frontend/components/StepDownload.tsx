"use client";

import { useState } from "react";
import { Download, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { generateCV, downloadBlob, CVData } from "@/lib/api";

interface StepDownloadProps {
  cvData: CVData;
  jobDescription: string;
  template: string;
  onBack: () => void;
}

type Status = "idle" | "tailoring" | "done" | "error";

export default function StepDownload({
  cvData,
  jobDescription,
  template,
  onBack,
}: StepDownloadProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [cvBlob, setCvBlob] = useState<Blob | null>(null);
  const [filename, setFilename] = useState("CV.docx");

  const handleGenerate = async () => {
    setCvBlob(null);
    setErrorMessage("");
    setStatus("tailoring");

    try {
      const blob = await generateCV(cvData, jobDescription, template);

      // Mirror the backend filename logic
      const safeName = cvData.name.replace(/\s+/g, "_").replace(/\//g, "_");
      const name = `CV_${safeName}.docx`;
      setFilename(name);

      setCvBlob(blob);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const handleDownload = () => {
    if (cvBlob) downloadBlob(cvBlob, filename);
  };

  const isLoading = status === "tailoring";

  return (
    <div className="animate-fade-up">
      <h2
        className="text-3xl md:text-4xl font-bold mb-2"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Generate your CV
      </h2>
      <p className="text-[#9A9A9A] mb-10 text-sm">
        One final AI pass to tailor your CV to the job. Takes about 10 seconds.
      </p>

      {/* Idle */}
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

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-4 px-8 py-4 border border-[#2E2E2E]">
          <RefreshCw
            size={16}
            className="animate-spin"
            style={{ color: "#FF4D00" }}
            aria-hidden="true"
          />
          <span
            className="text-sm text-[#F5F0EB] animate-pulse"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Tailoring your CV to the job…
          </span>
        </div>
      )}

      {/* Success */}
      {status === "done" && cvBlob && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 border border-[#2E2E2E]">
            <CheckCircle size={18} style={{ color: "#FF4D00" }} aria-hidden="true" />
            <span className="text-sm text-[#F5F0EB]">{filename}</span>
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

      {/* Error */}
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

      {/* Back — only before generation */}
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
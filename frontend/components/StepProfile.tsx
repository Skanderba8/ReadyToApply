"use client";

import { useState, useRef } from "react";
import { Upload, FileText, X } from "lucide-react";

interface StepProfileProps {
  file: File | null;
  pastedText: string;
  onFileChange: (file: File | null) => void;
  onPastedTextChange: (text: string) => void;
  onNext: () => void;
}

export default function StepProfile({
  file,
  pastedText,
  onFileChange,
  onPastedTextChange,
  onNext,
}: StepProfileProps) {
  const [tab, setTab] = useState<"upload" | "paste">("upload");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setError("");
    if (f.type !== "application/pdf") {
      setError("Only PDF files are accepted.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("File must be under 5MB.");
      return;
    }
    onFileChange(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleNext = () => {
    setError("");
    if (tab === "upload" && !file) {
      setError("Please upload your LinkedIn PDF.");
      return;
    }
    if (tab === "paste" && pastedText.trim().length < 50) {
      setError("Please paste at least 50 characters of your profile.");
      return;
    }
    onNext();
  };

  return (
    <div className="animate-fade-up">
      <h2
        className="text-3xl md:text-4xl font-bold mb-2"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Your profile
      </h2>
      <p className="text-[#9A9A9A] mb-8 text-sm">
        Upload your LinkedIn PDF export or paste your CV text.
      </p>

      {/* Tabs */}
      <div className="flex gap-px mb-6 border-b border-[#2E2E2E]">
        {(["upload", "paste"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(""); }}
            className="px-6 py-3 text-sm font-medium transition-colors duration-200 capitalize"
            style={{
              fontFamily: "var(--font-display)",
              color: tab === t ? "#FF4D00" : "#9A9A9A",
              borderBottom: tab === t ? "1px solid #FF4D00" : "1px solid transparent",
              marginBottom: "-1px",
            }}
          >
            {t === "upload" ? "Upload PDF" : "Paste text"}
          </button>
        ))}
      </div>

      {/* Upload tab */}
      {tab === "upload" && (
        <div>
          {!file ? (
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className="border border-dashed rounded-none p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200"
              style={{
                borderColor: dragOver ? "#FF4D00" : "#2E2E2E",
                backgroundColor: dragOver ? "#1C1C1C" : "transparent",
              }}
            >
              <Upload
                size={32}
                style={{ color: dragOver ? "#FF4D00" : "#9A9A9A" }}
                aria-hidden="true"
              />
              <div className="text-center">
                <p className="text-sm text-[#F5F0EB] mb-1">
                  Drag and drop your PDF here
                </p>
                <p className="text-xs text-[#9A9A9A]">
                  or click to browse — max 5MB
                </p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                aria-label="Upload LinkedIn PDF"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>
          ) : (
            <div
              className="border border-[#2E2E2E] p-6 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <FileText size={20} style={{ color: "#FF4D00" }} aria-hidden="true" />
                <div>
                  <p className="text-sm text-[#F5F0EB] font-medium">{file.name}</p>
                  <p className="text-xs text-[#9A9A9A]">
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => onFileChange(null)}
                className="text-[#9A9A9A] hover:text-[#F5F0EB] transition-colors"
                aria-label="Remove file"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Paste tab */}
      {tab === "paste" && (
        <textarea
          value={pastedText}
          onChange={(e) => onPastedTextChange(e.target.value)}
          placeholder="Paste your CV or LinkedIn profile text here..."
          rows={12}
          className="w-full bg-[#1C1C1C] border border-[#2E2E2E] text-[#F5F0EB] text-sm p-4 resize-none focus:outline-none focus:border-[#FF4D00] transition-colors duration-200 placeholder:text-[#9A9A9A]"
          style={{ fontFamily: "var(--font-body)" }}
        />
      )}

      {/* Error */}
      {error && (
        <p className="mt-3 text-sm text-red-400">{error}</p>
      )}

      {/* Next */}
      <div className="mt-8">
        <button
          onClick={handleNext}
          className="group inline-flex items-center gap-3 px-8 py-4 text-sm font-semibold text-[#111111] bg-[#FF4D00] hover:bg-[#FF8C42] transition-colors duration-200"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Continue
          <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
        </button>
      </div>
    </div>
  );
}
"use client";

import { useState, useRef } from "react";
import { Upload, FileText, X } from "lucide-react";
import { useLang } from "@/lib/i18n";

interface StepProfileProps {
  file: File | null;
  pastedText: string;
  onFileChange: (file: File | null) => void;
  onPastedTextChange: (text: string) => void;
  onNext: () => void;
}

export default function StepProfile({ file, pastedText, onFileChange, onPastedTextChange, onNext }: StepProfileProps) {
  const { u } = useLang();
  const [tab, setTab] = useState<"upload" | "paste">("upload");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setError("");
    if (f.type !== "application/pdf") { setError(u("errorPdf")); return; }
    if (f.size > 5 * 1024 * 1024) { setError(u("errorSize")); return; }
    onFileChange(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleNext = () => {
    setError("");
    if (tab === "upload" && !file) { setError(u("errorUpload")); return; }
    if (tab === "paste" && pastedText.trim().length < 50) { setError(u("errorPaste")); return; }
    onNext();
  };

  return (
    <div className="animate-fade-up">
      <h2 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
        {u("yourProfile")}
      </h2>
      <p className="text-[#9A9A9A] mb-8 text-sm">{u("profileSub")}</p>

      <div className="flex gap-px mb-6 border-b border-[#2E2E2E]">
        {(["upload", "paste"] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); setError(""); }}
            className="px-6 py-3 text-sm font-medium transition-colors duration-200"
            style={{
              fontFamily: "var(--font-display)",
              color: tab === t ? "#FF4D00" : "#9A9A9A",
              borderBottom: tab === t ? "1px solid #FF4D00" : "1px solid transparent",
              marginBottom: "-1px",
            }}>
            {t === "upload" ? u("uploadPdf") : u("pasteText")}
          </button>
        ))}
      </div>

      {tab === "upload" && (
        !file ? (
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className="border border-dashed rounded-none p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200"
            style={{ borderColor: dragOver ? "#FF4D00" : "#2E2E2E", backgroundColor: dragOver ? "#1C1C1C" : "transparent" }}>
            <Upload size={32} style={{ color: dragOver ? "#FF4D00" : "#9A9A9A" }} aria-hidden="true" />
            <div className="text-center">
              <p className="text-sm text-[#F5F0EB] mb-1">{u("dragDrop")}</p>
              <p className="text-xs text-[#9A9A9A]">{u("orClick")}</p>
            </div>
            <input ref={inputRef} type="file" accept=".pdf" className="hidden"
              aria-label="Upload LinkedIn PDF"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        ) : (
          <div className="border border-[#2E2E2E] p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText size={20} style={{ color: "#FF4D00" }} aria-hidden="true" />
              <div>
                <p className="text-sm text-[#F5F0EB] font-medium">{file.name}</p>
                <p className="text-xs text-[#9A9A9A]">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
            </div>
            <button onClick={() => onFileChange(null)}
              className="text-[#9A9A9A] hover:text-[#F5F0EB] transition-colors" aria-label="Remove file">
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        )
      )}

      {tab === "paste" && (
        <textarea value={pastedText} onChange={(e) => onPastedTextChange(e.target.value)}
          placeholder={u("pastePlaceholder")} rows={12}
          className="w-full bg-[#1C1C1C] border border-[#2E2E2E] text-[#F5F0EB] text-sm p-4 resize-none focus:outline-none focus:border-[#FF4D00] transition-colors duration-200 placeholder:text-[#9A9A9A]"
          style={{ fontFamily: "var(--font-body)" }} />
      )}

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <div className="mt-8">
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

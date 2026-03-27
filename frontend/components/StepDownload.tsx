"use client";

import { useEffect, useState } from "react";
import { Download, RefreshCw, CheckCircle, AlertCircle, Star } from "lucide-react";
import { generateCV, downloadBlob, CVData, Keywords } from "@/lib/api";
import { useLang } from "@/lib/i18n";

interface StepDownloadProps {
  cvData: CVData;
  jobDescription: string;
  template: string;
  keywords: Keywords | null;
  onRestart: () => void;
  onEdit: () => void;   // go back to step 3 with cached data
  onBack: () => void;
}

type Status = "generating" | "done" | "error";

// ─── Review widget ────────────────────────────────────────────────────────────

function ReviewWidget({ lang }: { lang: "en" | "fr" }) {
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const labels = {
    title:       { en: "How was your experience?", fr: "Comment s'est passée votre expérience ?" },
    placeholder: { en: "Leave a comment (optional)…", fr: "Laissez un commentaire (optionnel)…" },
    send:        { en: "Send feedback", fr: "Envoyer" },
    sending:     { en: "Sending…", fr: "Envoi…" },
    thanks:      { en: "Thank you for your feedback.", fr: "Merci pour votre retour." },
    thanksSub:   { en: "It helps us improve.", fr: "Cela nous aide à nous améliorer." },
  };
  const l = (k: keyof typeof labels) => labels[k][lang];

  const handleSend = async () => {
    if (stars === 0) return;
    setSending(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars, comment: comment.trim() }),
      });
    } catch { /* non-fatal */ }
    setSent(true);
    setSending(false);
  };

  if (sent) return (
    <div className="mt-12 pt-8 border-t border-[#2E2E2E]">
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 border border-[#FF4D00] flex items-center justify-center shrink-0">
          <CheckCircle size={14} style={{ color: "#FF4D00" }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#F5F0EB]" style={{ fontFamily: "var(--font-display)" }}>{l("thanks")}</p>
          <p className="text-xs text-[#9A9A9A] mt-1">{l("thanksSub")}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mt-12 pt-8 border-t border-[#2E2E2E]">
      <p className="text-sm text-[#9A9A9A] mb-4" style={{ fontFamily: "var(--font-display)" }}>{l("title")}</p>
      {/* Stars */}
      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setStars(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className="transition-colors duration-150">
            <Star size={20}
              fill={(hovered || stars) >= n ? "#FF4D00" : "none"}
              stroke={(hovered || stars) >= n ? "#FF4D00" : "#2E2E2E"}
            />
          </button>
        ))}
      </div>
      {/* Comment */}
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder={l("placeholder")}
        rows={3}
        maxLength={500}
        className="w-full bg-[#1C1C1C] border border-[#2E2E2E] text-[#F5F0EB] text-sm px-3 py-2 resize-none focus:outline-none focus:border-[#FF4D00] transition-colors placeholder:text-[#9A9A9A] mb-3"
        style={{ fontFamily: "var(--font-body)" }}
      />
      <button onClick={handleSend} disabled={stars === 0 || sending}
        className="px-5 py-2 text-xs font-semibold text-[#111111] bg-[#FF4D00] hover:bg-[#FF8C42] transition-colors disabled:opacity-40"
        style={{ fontFamily: "var(--font-body)" }}>
        {sending ? l("sending") : l("send")}
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function StepDownload({ cvData, jobDescription, template, keywords, onRestart, onEdit, onBack }: StepDownloadProps) {
  const { lang, u } = useLang();
  const [status, setStatus] = useState<Status>("generating");
  const [errorMessage, setErrorMessage] = useState("");
  const [docxBlob, setDocxBlob] = useState<Blob | null>(null);
  const safeName = cvData.name.replace(/\s+/g, "_").replace(/\//g, "_");

  // Auto-generate on mount
  useEffect(() => {
    generate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const generate = async () => {
    setDocxBlob(null); setErrorMessage(""); setStatus("generating");
    try {
      const blob = await generateCV(cvData, jobDescription, template, keywords ?? undefined);
      setDocxBlob(blob); setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <div className="animate-fade-up">
      <h2 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
        {u("generateTitle")}
      </h2>
      <p className="text-[#9A9A9A] mb-10 text-sm">{u("generateSub")}</p>

      {/* Generating */}
      {status === "generating" && (
        <div className="flex items-center gap-4 px-8 py-4 border border-[#2E2E2E]">
          <RefreshCw size={16} className="animate-spin" style={{ color: "#FF4D00" }} aria-hidden="true" />
          <span className="text-sm text-[#F5F0EB] animate-pulse" style={{ fontFamily: "var(--font-body)" }}>
            {u("tailoring")}
          </span>
        </div>
      )}

      {/* Done */}
      {status === "done" && docxBlob && (
        <>
          <div className="flex items-center gap-3 p-4 border border-[#2E2E2E] mb-5">
            <CheckCircle size={18} style={{ color: "#FF4D00" }} aria-hidden="true" />
            <span className="text-sm text-[#F5F0EB]">CV_{safeName}.docx</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => downloadBlob(docxBlob, `CV_${safeName}.docx`)}
              className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[#111111] bg-[#FF4D00] hover:bg-[#FF8C42] transition-colors duration-200"
              style={{ fontFamily: "var(--font-body)" }}>
              <Download size={15} aria-hidden="true" />
              {u("downloadDocx")}
            </button>
            <button onClick={onEdit}
              className="px-6 py-3 text-sm text-[#9A9A9A] hover:text-[#F5F0EB] transition-colors border border-[#2E2E2E] hover:border-[#9A9A9A]"
              style={{ fontFamily: "var(--font-body)" }}>
              {u("editBtn")}
            </button>
            <button onClick={onRestart}
              className="px-6 py-3 text-sm text-[#9A9A9A] hover:text-[#F5F0EB] transition-colors border border-[#2E2E2E] hover:border-[#9A9A9A]"
              style={{ fontFamily: "var(--font-body)" }}>
              {lang === "fr" ? "Recommencer" : "Start over"}
            </button>
          </div>
          <ReviewWidget lang={lang} />
        </>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 border border-red-900 bg-red-950/30">
            <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-red-400 mb-1">{u("generationFailed")}</p>
              <p className="text-xs text-red-400/70">{errorMessage}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={generate}
              className="group inline-flex items-center gap-3 px-8 py-4 text-sm font-semibold text-[#111111] bg-[#FF4D00] hover:bg-[#FF8C42] transition-colors duration-200"
              style={{ fontFamily: "var(--font-body)" }}>
              {u("tryAgain")} →
            </button>
            <button onClick={onBack}
              className="px-6 py-4 text-sm text-[#9A9A9A] hover:text-[#F5F0EB] transition-colors border border-[#2E2E2E] hover:border-[#9A9A9A]"
              style={{ fontFamily: "var(--font-body)" }}>
              {u("back")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

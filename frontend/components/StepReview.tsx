"use client";

import { useEffect, useState } from "react";
import { RefreshCw, AlertCircle, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { extractCV, CVData, Keywords } from "@/lib/api";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface StepReviewProps {
  file: File | null;
  pastedText: string;
  jobDescription: string;
  onNext: (cv: CVData, keywords: Keywords) => void;
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Small reusable UI pieces
// ---------------------------------------------------------------------------
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs font-semibold uppercase tracking-widest text-[#9A9A9A] mb-3"
      style={{ fontFamily: "var(--font-display)" }}
    >
      {children}
    </p>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  maxLength?: number;
}) {
  const base =
    "w-full bg-[#1C1C1C] border border-[#2E2E2E] text-[#F5F0EB] text-sm px-3 py-2 focus:outline-none focus:border-[#FF4D00] transition-colors";
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-[#9A9A9A]">{label}</label>
      {multiline ? (
        <textarea
          className={`${base} resize-y min-h-[80px]`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
        />
      ) : (
        <input
          type="text"
          className={base}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
        />
      )}
      {maxLength && (
        <p className="text-xs text-[#9A9A9A] text-right">
          {value.length} / {maxLength}
        </p>
      )}
    </div>
  );
}

function Pill({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#1C1C1C] border border-[#2E2E2E] text-xs text-[#F5F0EB]">
      {label}
      <button
        onClick={onRemove}
        className="text-[#9A9A9A] hover:text-[#FF4D00] transition-colors"
        aria-label={`Remove ${label}`}
      >
        <X size={11} />
      </button>
    </span>
  );
}

function AddPill({ onAdd }: { onAdd: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");

  const commit = () => {
    const trimmed = value.trim();
    if (trimmed) onAdd(trimmed);
    setValue("");
    setEditing(false);
  };

  if (!editing)
    return (
      <button
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1 px-2 py-1 border border-dashed border-[#2E2E2E] text-xs text-[#9A9A9A] hover:border-[#FF4D00] hover:text-[#FF4D00] transition-colors"
      >
        <Plus size={11} /> Add
      </button>
    );

  return (
    <span className="inline-flex items-center gap-1">
      <input
        autoFocus
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className="bg-[#1C1C1C] border border-[#FF4D00] text-[#F5F0EB] text-xs px-2 py-1 w-32 focus:outline-none"
        placeholder="Enter…"
      />
      <button onClick={commit} className="text-xs text-[#FF4D00] px-1">
        ✓
      </button>
    </span>
  );
}

// Collapsible section wrapper
function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#2E2E2E]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#1C1C1C] transition-colors"
      >
        <span
          className="text-sm font-semibold text-[#F5F0EB]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </span>
        {open ? (
          <ChevronUp size={14} className="text-[#9A9A9A]" />
        ) : (
          <ChevronDown size={14} className="text-[#9A9A9A]" />
        )}
      </button>
      {open && <div className="px-4 pb-4 pt-2 space-y-4">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function StepReview({
  file,
  pastedText,
  jobDescription,
  onNext,
  onBack,
}: StepReviewProps) {
  type LoadState = "loading" | "ready" | "error";
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const [cv, setCv] = useState<CVData | null>(null);
  const [keywords, setKeywords] = useState<Keywords>({
    technical: [],
    soft: [],
    industry: [],
  });

  // Run extraction once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await extractCV(file, pastedText, jobDescription);
        if (!cancelled) {
          setCv(result.cv);
          setKeywords(result.keywords);
          setLoadState("ready");
        }
      } catch (e) {
        if (!cancelled) {
          setErrorMessage(e instanceof Error ? e.message : "Something went wrong.");
          setLoadState("error");
        }
      }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // CV field updaters
  // ---------------------------------------------------------------------------
  const updateContact = (field: keyof CVData["contact"], value: string) =>
    setCv((prev) => prev ? { ...prev, contact: { ...prev.contact, [field]: value } } : prev);

  const updateExperience = (i: number, field: keyof CVData["experience"][0], value: string) =>
    setCv((prev) => {
      if (!prev) return prev;
      const exp = [...prev.experience];
      exp[i] = { ...exp[i], [field]: value };
      return { ...prev, experience: exp };
    });

  const updateExpBullet = (ei: number, bi: number, value: string) =>
    setCv((prev) => {
      if (!prev) return prev;
      const exp = [...prev.experience];
      const bullets = [...exp[ei].bullets];
      bullets[bi] = value;
      exp[ei] = { ...exp[ei], bullets };
      return { ...prev, experience: exp };
    });

  const addExpBullet = (ei: number) =>
    setCv((prev) => {
      if (!prev) return prev;
      const exp = [...prev.experience];
      if (exp[ei].bullets.length >= 4) return prev;
      exp[ei] = { ...exp[ei], bullets: [...exp[ei].bullets, ""] };
      return { ...prev, experience: exp };
    });

  const removeExpBullet = (ei: number, bi: number) =>
    setCv((prev) => {
      if (!prev) return prev;
      const exp = [...prev.experience];
      exp[ei] = { ...exp[ei], bullets: exp[ei].bullets.filter((_, j) => j !== bi) };
      return { ...prev, experience: exp };
    });

  const addExperience = () =>
    setCv((prev) =>
      prev
        ? {
            ...prev,
            experience: [
              ...prev.experience,
              { company: "", title: "", location: "", start: "", end: "", bullets: [""] },
            ],
          }
        : prev
    );

  const removeExperience = (i: number) =>
    setCv((prev) =>
      prev ? { ...prev, experience: prev.experience.filter((_, j) => j !== i) } : prev
    );

  const updateEducation = (i: number, field: keyof CVData["education"][0], value: string) =>
    setCv((prev) => {
      if (!prev) return prev;
      const edu = [...prev.education];
      edu[i] = { ...edu[i], [field]: value };
      return { ...prev, education: edu };
    });

  const addEducation = () =>
    setCv((prev) =>
      prev
        ? {
            ...prev,
            education: [...prev.education, { institution: "", degree: "", field: "", year: "" }],
          }
        : prev
    );

  const removeEducation = (i: number) =>
    setCv((prev) =>
      prev ? { ...prev, education: prev.education.filter((_, j) => j !== i) } : prev
    );

  const updateCert = (i: number, field: keyof CVData["certifications"][0], value: string) =>
    setCv((prev) => {
      if (!prev) return prev;
      const certs = [...prev.certifications];
      certs[i] = { ...certs[i], [field]: value };
      return { ...prev, certifications: certs };
    });

  const addCert = () =>
    setCv((prev) =>
      prev
        ? { ...prev, certifications: [...prev.certifications, { name: "", issuer: "", year: "" }] }
        : prev
    );

  const removeCert = (i: number) =>
    setCv((prev) =>
      prev ? { ...prev, certifications: prev.certifications.filter((_, j) => j !== i) } : prev
    );

  // Skills
  const addSkill = (v: string) =>
    setCv((prev) =>
      prev && prev.skills.length < 12 ? { ...prev, skills: [...prev.skills, v] } : prev
    );
  const removeSkill = (i: number) =>
    setCv((prev) =>
      prev ? { ...prev, skills: prev.skills.filter((_, j) => j !== i) } : prev
    );

  // Keywords
  const addKeyword = (bucket: keyof Keywords, v: string) =>
    setKeywords((k) => ({ ...k, [bucket]: [...k[bucket], v] }));
  const removeKeyword = (bucket: keyof Keywords, i: number) =>
    setKeywords((k) => ({ ...k, [bucket]: k[bucket].filter((_, j) => j !== i) }));

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (loadState === "loading") {
    return (
      <div className="animate-fade-up">
        <h2
          className="text-3xl md:text-4xl font-bold mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Analysing your profile…
        </h2>
        <p className="text-[#9A9A9A] mb-10 text-sm">
          Extracting your experience and matching it to the job. Takes about 15 seconds.
        </p>
        <div className="flex items-center gap-4 px-8 py-4 border border-[#2E2E2E]">
          <RefreshCw size={16} className="animate-spin" style={{ color: "#FF4D00" }} />
          <span className="text-sm text-[#F5F0EB] animate-pulse">
            Reading your CV and job description…
          </span>
        </div>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="animate-fade-up space-y-4">
        <h2
          className="text-3xl md:text-4xl font-bold mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Something went wrong
        </h2>
        <div className="flex items-start gap-3 p-4 border border-red-900 bg-red-950/30">
          <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-400 mb-1">Extraction failed</p>
            <p className="text-xs text-red-400/70">{errorMessage}</p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="px-6 py-4 text-sm text-[#9A9A9A] hover:text-[#F5F0EB] transition-colors border border-[#2E2E2E] hover:border-[#9A9A9A]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          ← Back
        </button>
      </div>
    );
  }

  if (!cv) return null;

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h2
          className="text-3xl md:text-4xl font-bold mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Review your CV
        </h2>
        <p className="text-[#9A9A9A] text-sm">
          Check everything looks right. Edit any field before generating.
        </p>
      </div>

      {/* ── Basics ── */}
      <Section title="Basics">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Full name" value={cv.name} onChange={(v) => setCv({ ...cv, name: v })} />
          <Field label="Professional title" value={cv.title} onChange={(v) => setCv({ ...cv, title: v })} />
        </div>
        <Field
          label="Summary"
          value={cv.summary}
          onChange={(v) => setCv({ ...cv, summary: v })}
          multiline
          maxLength={400}
        />
      </Section>

      {/* ── Contact ── */}
      <Section title="Contact" defaultOpen={false}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Email" value={cv.contact.email} onChange={(v) => updateContact("email", v)} />
          <Field label="Phone" value={cv.contact.phone} onChange={(v) => updateContact("phone", v)} />
          <Field label="Location" value={cv.contact.location} onChange={(v) => updateContact("location", v)} />
          <Field label="LinkedIn URL" value={cv.contact.linkedin ?? ""} onChange={(v) => updateContact("linkedin", v)} />
        </div>
      </Section>

      {/* ── Experience ── */}
      <Section title={`Experience (${cv.experience.length})`}>
        <div className="space-y-5">
          {cv.experience.map((job, ei) => (
            <div key={ei} className="border border-[#2E2E2E] p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9A9A9A]">Role {ei + 1}</span>
                <button
                  onClick={() => removeExperience(ei)}
                  className="text-xs text-[#9A9A9A] hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <X size={11} /> Remove
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Company" value={job.company} onChange={(v) => updateExperience(ei, "company", v)} />
                <Field label="Title" value={job.title} onChange={(v) => updateExperience(ei, "title", v)} />
                <Field label="Location" value={job.location} onChange={(v) => updateExperience(ei, "location", v)} />
                <Field label="Start" value={job.start} onChange={(v) => updateExperience(ei, "start", v)} />
                <Field label="End" value={job.end} onChange={(v) => updateExperience(ei, "end", v)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#9A9A9A]">Bullets (max 4)</label>
                {job.bullets.map((b, bi) => (
                  <div key={bi} className="flex gap-2">
                    <input
                      type="text"
                      value={b}
                      onChange={(e) => updateExpBullet(ei, bi, e.target.value)}
                      className="flex-1 bg-[#1C1C1C] border border-[#2E2E2E] text-[#F5F0EB] text-sm px-3 py-2 focus:outline-none focus:border-[#FF4D00] transition-colors"
                    />
                    <button
                      onClick={() => removeExpBullet(ei, bi)}
                      className="text-[#9A9A9A] hover:text-red-400 transition-colors px-2"
                      aria-label="Remove bullet"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
                {job.bullets.length < 4 && (
                  <button
                    onClick={() => addExpBullet(ei)}
                    className="text-xs text-[#9A9A9A] hover:text-[#FF4D00] transition-colors flex items-center gap-1 mt-1"
                  >
                    <Plus size={11} /> Add bullet
                  </button>
                )}
              </div>
            </div>
          ))}
          <button
            onClick={addExperience}
            className="w-full py-3 border border-dashed border-[#2E2E2E] text-xs text-[#9A9A9A] hover:border-[#FF4D00] hover:text-[#FF4D00] transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={13} /> Add experience
          </button>
        </div>
      </Section>

      {/* ── Education ── */}
      <Section title={`Education (${cv.education.length})`} defaultOpen={false}>
        <div className="space-y-4">
          {cv.education.map((edu, i) => (
            <div key={i} className="border border-[#2E2E2E] p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9A9A9A]">Entry {i + 1}</span>
                <button
                  onClick={() => removeEducation(i)}
                  className="text-xs text-[#9A9A9A] hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <X size={11} /> Remove
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Institution" value={edu.institution} onChange={(v) => updateEducation(i, "institution", v)} />
                <Field label="Degree" value={edu.degree} onChange={(v) => updateEducation(i, "degree", v)} />
                <Field label="Field of study" value={edu.field} onChange={(v) => updateEducation(i, "field", v)} />
                <Field label="Year" value={edu.year} onChange={(v) => updateEducation(i, "year", v)} />
              </div>
            </div>
          ))}
          <button
            onClick={addEducation}
            className="w-full py-3 border border-dashed border-[#2E2E2E] text-xs text-[#9A9A9A] hover:border-[#FF4D00] hover:text-[#FF4D00] transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={13} /> Add education
          </button>
        </div>
      </Section>

      {/* ── Skills ── */}
      <Section title={`Skills (${cv.skills.length}/12)`} defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {cv.skills.map((s, i) => (
            <Pill key={i} label={s} onRemove={() => removeSkill(i)} />
          ))}
          {cv.skills.length < 12 && <AddPill onAdd={addSkill} />}
        </div>
      </Section>

      {/* ── Certifications ── */}
      {(cv.certifications.length > 0) && (
        <Section title={`Certifications (${cv.certifications.length})`} defaultOpen={false}>
          <div className="space-y-4">
            {cv.certifications.map((cert, i) => (
              <div key={i} className="border border-[#2E2E2E] p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9A9A9A]">Cert {i + 1}</span>
                  <button
                    onClick={() => removeCert(i)}
                    className="text-xs text-[#9A9A9A] hover:text-red-400 transition-colors flex items-center gap-1"
                  >
                    <X size={11} /> Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Name" value={cert.name} onChange={(v) => updateCert(i, "name", v)} />
                  <Field label="Issuer" value={cert.issuer} onChange={(v) => updateCert(i, "issuer", v)} />
                  <Field label="Year" value={cert.year} onChange={(v) => updateCert(i, "year", v)} />
                </div>
              </div>
            ))}
            <button
              onClick={addCert}
              className="w-full py-3 border border-dashed border-[#2E2E2E] text-xs text-[#9A9A9A] hover:border-[#FF4D00] hover:text-[#FF4D00] transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={13} /> Add certification
            </button>
          </div>
        </Section>
      )}

      {/* ── Keywords ── */}
      <Section title="Job Keywords" defaultOpen={false}>
        <p className="text-xs text-[#9A9A9A] mb-3">
          These keywords were extracted from the job description. The AI will use them when tailoring your CV.
          Add or remove as needed.
        </p>
        {(["technical", "soft", "industry"] as const).map((bucket) => (
          <div key={bucket} className="mb-4">
            <SectionLabel>{bucket}</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {keywords[bucket].map((k, i) => (
                <Pill key={i} label={k} onRemove={() => removeKeyword(bucket, i)} />
              ))}
              <AddPill onAdd={(v) => addKeyword(bucket, v)} />
            </div>
          </div>
        ))}
      </Section>

      {/* ── Actions ── */}
      <div className="flex items-center gap-4 pt-2">
        <button
          onClick={onBack}
          className="px-6 py-4 text-sm text-[#9A9A9A] hover:text-[#F5F0EB] transition-colors border border-[#2E2E2E] hover:border-[#9A9A9A]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          ← Back
        </button>
        <button
          onClick={() => onNext(cv, keywords)}
          className="group inline-flex items-center gap-3 px-8 py-4 text-sm font-semibold text-[#111111] bg-[#FF4D00] hover:bg-[#FF8C42] transition-colors duration-200"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Looks good — choose template
          <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
        </button>
      </div>
    </div>
  );
}
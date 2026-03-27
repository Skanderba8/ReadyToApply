"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RefreshCw, AlertCircle, Plus, X, ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { extractCV, CVData, Keywords } from "@/lib/api";
import { useLang } from "@/lib/i18n";

// ─── Types ───────────────────────────────────────────────────────────────────

type SectionId = "basics" | "contact" | "experience" | "education" | "skills"
  | "certifications" | "languages" | "projects" | "keywords";

interface SectionDef {
  id: SectionId;
  label: (cv: CVData) => string;
  optional?: boolean;
}

const LANGUAGE_LEVELS_EN = ["Native", "Fluent", "Professional", "Intermediate", "Basic"];
const LANGUAGE_LEVELS_FR = ["Natif", "Courant", "Professionnel", "Intermédiaire", "Notions"];

// Common languages with EN/FR names
const LANGUAGES_EN = [
  "English", "French", "Arabic", "Spanish", "German", "Italian", "Portuguese",
  "Chinese", "Japanese", "Russian", "Dutch", "Turkish", "Polish", "Swedish",
  "Danish", "Norwegian", "Finnish", "Korean", "Hindi", "Other",
];
const LANGUAGES_FR = [
  "Anglais", "Français", "Arabe", "Espagnol", "Allemand", "Italien", "Portugais",
  "Chinois", "Japonais", "Russe", "Néerlandais", "Turc", "Polonais", "Suédois",
  "Danois", "Norvégien", "Finnois", "Coréen", "Hindi", "Autre",
];


// ─── Small UI components ──────────────────────────────────────────────────────

function Field({ label, value, onChange, multiline = false, maxLength }: {
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; maxLength?: number;
}) {
  const base = "w-full bg-[#1C1C1C] border border-[#2E2E2E] text-[#F5F0EB] text-sm px-3 py-2 focus:outline-none focus:border-[#FF4D00] transition-colors";
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-[#9A9A9A]">{label}</label>
      {multiline
        ? <textarea className={`${base} resize-y min-h-[80px]`} value={value}
            onChange={e => onChange(e.target.value)} maxLength={maxLength} />
        : <input type="text" className={base} value={value}
            onChange={e => onChange(e.target.value)} maxLength={maxLength} />}
      {maxLength && <p className="text-xs text-[#9A9A9A] text-right">{value.length} / {maxLength}</p>}
    </div>
  );
}

function Pill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1C1C1C] border border-[#2E2E2E] text-xs text-[#F5F0EB] rounded-sm">
      {label}
      <button onClick={onRemove} className="text-[#9A9A9A] hover:text-[#FF4D00] transition-colors ml-0.5" aria-label={`Remove ${label}`}>
        <X size={10} />
      </button>
    </span>
  );
}

function AddPill({ placeholder, onAdd }: { placeholder: string; onAdd: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const commit = () => {
    const t = value.trim();
    if (t) onAdd(t);
    setValue(""); setEditing(false);
  };
  if (!editing)
    return (
      <button onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1 px-2.5 py-1 border border-dashed border-[#2E2E2E] text-xs text-[#9A9A9A] hover:border-[#FF4D00] hover:text-[#FF4D00] transition-colors rounded-sm">
        <Plus size={10} /> {placeholder}
      </button>
    );
  return (
    <span className="inline-flex items-center gap-1">
      <input autoFocus type="text" value={value} onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        className="bg-[#1C1C1C] border border-[#FF4D00] text-[#F5F0EB] text-xs px-2 py-1 w-32 focus:outline-none rounded-sm"
        placeholder="…" />
      <button onClick={commit} className="text-xs text-[#FF4D00] px-1">✓</button>
    </span>
  );
}

function Toggle({ enabled, onChange, label }: { enabled: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${enabled ? "bg-[#FF4D00]" : "bg-[#2E2E2E]"}`}
      aria-label={label}>
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-[#F5F0EB] shadow transition-transform ${enabled ? "translate-x-4" : "translate-x-1"}`} />
    </button>
  );
}

// ─── Sortable section wrapper ─────────────────────────────────────────────────

function SortableSection({ id, title, children, defaultOpen = false, rightSlot }: {
  id: string; title: string; children: React.ReactNode;
  defaultOpen?: boolean; rightSlot?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}
      className="border border-[#2E2E2E] bg-[#161616] overflow-hidden">
      <div className="flex items-center bg-[#1C1C1C] border-b border-[#2E2E2E]">
        {/* drag handle */}
        <button {...attributes} {...listeners}
          className="px-3 py-3 text-[#444444] hover:text-[#9A9A9A] cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag to reorder">
          <GripVertical size={14} />
        </button>
        {/* toggle open */}
        <button onClick={() => setOpen(o => !o)}
          className="flex-1 flex items-center justify-between pr-4 py-3 text-left">
          <span className="text-sm font-semibold text-[#F5F0EB]">{title}</span>
          <div className="flex items-center gap-3">
            {rightSlot}
            {open ? <ChevronUp size={14} className="text-[#9A9A9A]" /> : <ChevronDown size={14} className="text-[#9A9A9A]" />}
          </div>
        </button>
      </div>
      {open && <div className="px-4 pb-4 pt-3 space-y-4">{children}</div>}
    </div>
  );
}


// ─── Props ────────────────────────────────────────────────────────────────────

interface StepReviewProps {
  file: File | null;
  pastedText: string;
  jobDescription: string;
  initialCv?: CVData | null;
  initialKeywords?: Keywords | null;
  onNext: (cv: CVData, keywords: Keywords) => void;
  onBack: () => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function StepReview({ file, pastedText, jobDescription, initialCv, initialKeywords, onNext, onBack }: StepReviewProps) {
  const { lang, setLang, u } = useLang();
  const LANGUAGE_LEVELS = lang === "fr" ? LANGUAGE_LEVELS_FR : LANGUAGE_LEVELS_EN;
  const LANGUAGES = lang === "fr" ? LANGUAGES_FR : LANGUAGES_EN;

  type LoadState = "loading" | "ready" | "error";
  const [loadState, setLoadState] = useState<LoadState>(initialCv ? "ready" : "loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [cv, setCv] = useState<CVData | null>(initialCv ?? null);
  const [keywords, setKeywords] = useState<Keywords>(initialKeywords ?? { technical: [], soft: [], industry: [] });

  // Section order + optional section toggles
  const allSections: SectionDef[] = [
    { id: "basics", label: () => u("basics") },
    { id: "contact", label: () => u("contact") },
    { id: "experience", label: (cv) => `${u("experience")} (${cv.experience.length})` },
    { id: "education", label: (cv) => `${u("education")} (${cv.education.length})` },
    { id: "skills", label: (cv) => `${u("skills")} (${cv.skills.length}/12)` },
    { id: "certifications", label: (cv) => `${u("certifications")} (${cv.certifications.length})` },
    { id: "languages", label: (cv) => `${u("languages")} (${cv.languages.length})`, optional: true },
    { id: "projects", label: (cv) => `${u("projects")} (${cv.projects.length})`, optional: true },
    { id: "keywords", label: () => u("keywords") },
  ];

  const [sectionOrder, setSectionOrder] = useState<SectionId[]>(
    allSections.map(s => s.id)
  );
  const [enabledOptional, setEnabledOptional] = useState<Record<string, boolean>>({
    languages: false,
    projects: false,
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSectionOrder(prev => {
        const oldIdx = prev.indexOf(active.id as SectionId);
        const newIdx = prev.indexOf(over.id as SectionId);
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  }, []);

  useEffect(() => {
    if (initialCv) return; // already have data, skip extraction
    let cancelled = false;
    (async () => {
      try {
        const result = await extractCV(file, pastedText, jobDescription);
        if (!cancelled) {
          // Ensure new fields exist
          const cv = {
            ...result.cv,
            languages: result.cv.languages ?? [],
            projects: result.cv.projects ?? [],
          };
          setCv(cv);
          setKeywords(result.keywords);
          // Auto-enable optional sections if data was found
          setEnabledOptional({
            languages: (cv.languages?.length ?? 0) > 0,
            projects: (cv.projects?.length ?? 0) > 0,
          });
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

  // ── Updaters ────────────────────────────────────────────────────────────────

  const upd = (patch: Partial<CVData>) => setCv(prev => prev ? { ...prev, ...patch } : prev);
  const updContact = (f: keyof CVData["contact"] | "github", v: string) =>
    setCv(prev => prev ? { ...prev, contact: { ...prev.contact, [f]: v } } : prev);
  const updExp = (i: number, f: keyof CVData["experience"][0], v: string) =>
    setCv(prev => { if (!prev) return prev; const e = [...prev.experience]; e[i] = { ...e[i], [f]: v }; return { ...prev, experience: e }; });
  const updExpBullet = (ei: number, bi: number, v: string) =>
    setCv(prev => { if (!prev) return prev; const e = [...prev.experience]; const b = [...e[ei].bullets]; b[bi] = v; e[ei] = { ...e[ei], bullets: b }; return { ...prev, experience: e }; });
  const addExpBullet = (ei: number) =>
    setCv(prev => { if (!prev || prev.experience[ei].bullets.length >= 6) return prev; const e = [...prev.experience]; e[ei] = { ...e[ei], bullets: [...e[ei].bullets, ""] }; return { ...prev, experience: e }; });
  const removeExpBullet = (ei: number, bi: number) =>
    setCv(prev => { if (!prev) return prev; const e = [...prev.experience]; e[ei] = { ...e[ei], bullets: e[ei].bullets.filter((_, j) => j !== bi) }; return { ...prev, experience: e }; });
  const updEdu = (i: number, f: keyof CVData["education"][0], v: string) =>
    setCv(prev => { if (!prev) return prev; const e = [...prev.education]; e[i] = { ...e[i], [f]: v }; return { ...prev, education: e }; });
  const updCert = (i: number, f: keyof CVData["certifications"][0], v: string) =>
    setCv(prev => { if (!prev) return prev; const c = [...prev.certifications]; c[i] = { ...c[i], [f]: v }; return { ...prev, certifications: c }; });
  const updLang = (i: number, f: "language" | "level", v: string) =>
    setCv(prev => { if (!prev) return prev; const l = [...prev.languages]; l[i] = { ...l[i], [f]: v }; return { ...prev, languages: l }; });
  const updProj = (i: number, f: keyof CVData["projects"][0], v: string) =>
    setCv(prev => { if (!prev) return prev; const p = [...prev.projects]; p[i] = { ...p[i], [f]: v }; return { ...prev, projects: p }; });

  const addSkill = (v: string) => setCv(prev => prev && prev.skills.length < 12 ? { ...prev, skills: [...prev.skills, v] } : prev);
  const removeSkill = (i: number) => setCv(prev => prev ? { ...prev, skills: prev.skills.filter((_, j) => j !== i) } : prev);
  const addKw = (b: keyof Keywords, v: string) => setKeywords(k => ({ ...k, [b]: [...k[b], v] }));
  const removeKw = (b: keyof Keywords, i: number) => setKeywords(k => ({ ...k, [b]: k[b].filter((_, j) => j !== i) }));

  // ── Loading / error states ───────────────────────────────────────────────────

  if (loadState === "loading") return (
    <div className="animate-fade-up">
      <h2 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
        {u("analysing")}
      </h2>
      <p className="text-[#9A9A9A] mb-10 text-sm">
        {u("analysingTime")}
      </p>
      <div className="flex items-center gap-4 px-8 py-4 border border-[#2E2E2E]">
        <RefreshCw size={16} className="animate-spin" style={{ color: "#FF4D00" }} />
        <span className="text-sm text-[#F5F0EB] animate-pulse">
          {u("analysingMsg")}
        </span>
      </div>
    </div>
  );

  if (loadState === "error") return (
    <div className="animate-fade-up space-y-4">
      <h2 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
        {u("errorTitle")}
      </h2>
      <div className="flex items-start gap-3 p-4 border border-red-900 bg-red-950/30">
        <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-red-400 mb-1">{u("extractFailed")}</p>
          <p className="text-xs text-red-400/70">{errorMessage}</p>
        </div>
      </div>
      <button onClick={onBack} className="px-6 py-4 text-sm text-[#9A9A9A] hover:text-[#F5F0EB] transition-colors border border-[#2E2E2E] hover:border-[#9A9A9A]">
        {u("back")}
      </button>
    </div>
  );

  if (!cv) return null;

  // ── Section renderers ────────────────────────────────────────────────────────

  const sectionContent: Record<SectionId, React.ReactNode> = {
    basics: (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={u("fullName")} value={cv.name} onChange={v => upd({ name: v })} />
          <Field label={u("profTitle")} value={cv.title} onChange={v => upd({ title: v })} />
        </div>
        <Field label={u("summary")} value={cv.summary} onChange={v => upd({ summary: v })} multiline maxLength={800} />
      </>
    ),
    contact: (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Email" value={cv.contact.email} onChange={v => updContact("email", v)} />
        <Field label="Phone" value={cv.contact.phone} onChange={v => updContact("phone", v)} />
        <Field label="Location" value={cv.contact.location} onChange={v => updContact("location", v)} />
        <Field label="LinkedIn URL" value={cv.contact.linkedin ?? ""} onChange={v => updContact("linkedin", v)} />
        <Field label="GitHub URL" value={cv.contact.github ?? ""} onChange={v => updContact("github", v)} />
      </div>
    ),
    experience: (
      <div className="space-y-4">
        {cv.experience.map((job, ei) => (
          <div key={ei} className="border border-[#2E2E2E] p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9A9A9A]">{`${u("roleN")} ${ei + 1}`}</span>
              <button onClick={() => upd({ experience: cv.experience.filter((_, j) => j !== ei) })}
                className="text-xs text-[#9A9A9A] hover:text-red-400 transition-colors flex items-center gap-1">
                <X size={11} /> {u("remove")}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={u("company")} value={job.company} onChange={v => updExp(ei, "company", v)} />
              <Field label={u("title")} value={job.title} onChange={v => updExp(ei, "title", v)} />
              <Field label={u("location")} value={job.location} onChange={v => updExp(ei, "location", v)} />
              <Field label={u("start")} value={job.start} onChange={v => updExp(ei, "start", v)} />
              <Field label={u("end")} value={job.end} onChange={v => updExp(ei, "end", v)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-[#9A9A9A]">{u("bullets")} (max 6)</label>
              {job.bullets.map((b, bi) => (
                <div key={bi} className="flex gap-2">
                  <input type="text" value={b} onChange={e => updExpBullet(ei, bi, e.target.value)}
                    className="flex-1 bg-[#1C1C1C] border border-[#2E2E2E] text-[#F5F0EB] text-sm px-3 py-2 focus:outline-none focus:border-[#FF4D00] transition-colors" />
                  <button onClick={() => removeExpBullet(ei, bi)}
                    className="text-[#9A9A9A] hover:text-red-400 transition-colors px-2" aria-label="Remove bullet">
                    <X size={13} />
                  </button>
                </div>
              ))}
              {job.bullets.length < 6 && (
                <button onClick={() => addExpBullet(ei)}
                  className="text-xs text-[#9A9A9A] hover:text-[#FF4D00] transition-colors flex items-center gap-1 mt-1">
                  <Plus size={11} /> {u("addBullet")}
                </button>
              )}
            </div>
          </div>
        ))}
        <button onClick={() => upd({ experience: [...cv.experience, { company: "", title: "", location: "", start: "", end: "", bullets: [""] }] })}
          className="w-full py-3 border border-dashed border-[#2E2E2E] text-xs text-[#9A9A9A] hover:border-[#FF4D00] hover:text-[#FF4D00] transition-colors flex items-center justify-center gap-2 rounded-sm">
          <Plus size={13} /> {u("addExperience")}
        </button>
      </div>
    ),
    education: (
      <div className="space-y-4">
        {cv.education.map((edu, i) => (
          <div key={i} className="border border-[#2E2E2E] rounded-sm p-3 space-y-3 bg-[#1C1C1C]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9A9A9A]">{i + 1}</span>
              <button onClick={() => upd({ education: cv.education.filter((_, j) => j !== i) })}
                className="text-xs text-[#9A9A9A] hover:text-red-400 transition-colors flex items-center gap-1">
                <X size={11} /> {u("remove")}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={u("institution")} value={edu.institution} onChange={v => updEdu(i, "institution", v)} />
              <Field label={u("degree")} value={edu.degree} onChange={v => updEdu(i, "degree", v)} />
              <Field label={u("field")} value={edu.field} onChange={v => updEdu(i, "field", v)} />
              <Field label={u("year")} value={edu.year} onChange={v => updEdu(i, "year", v)} />
            </div>
          </div>
        ))}
        <button onClick={() => upd({ education: [...cv.education, { institution: "", degree: "", field: "", year: "" }] })}
          className="w-full py-3 border border-dashed border-[#2E2E2E] text-xs text-[#9A9A9A] hover:border-[#FF4D00] hover:text-[#FF4D00] transition-colors flex items-center justify-center gap-2 rounded-sm">
          <Plus size={13} /> {u("addEducation")}
        </button>
      </div>
    ),
    skills: (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {cv.skills.map((s, i) => <Pill key={i} label={s} onRemove={() => removeSkill(i)} />)}
          {cv.skills.length < 12 && <AddPill placeholder={u("addSkill")} onAdd={addSkill} />}
        </div>
        <p className="text-xs text-[#9A9A9A]">{cv.skills.length}/12</p>
      </div>
    ),
    certifications: (
      <div className="space-y-4">
        {cv.certifications.map((cert, i) => (
          <div key={i} className="border border-[#2E2E2E] rounded-sm p-3 space-y-3 bg-[#1C1C1C]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9A9A9A]">{i + 1}</span>
              <button onClick={() => upd({ certifications: cv.certifications.filter((_, j) => j !== i) })}
                className="text-xs text-[#9A9A9A] hover:text-red-400 transition-colors flex items-center gap-1">
                <X size={11} /> {u("remove")}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={u("projName")} value={cert.name} onChange={v => updCert(i, "name", v)} />
              <Field label={u("issuer")} value={cert.issuer} onChange={v => updCert(i, "issuer", v)} />
              <Field label={u("year")} value={cert.year} onChange={v => updCert(i, "year", v)} />
            </div>
          </div>
        ))}
        <button onClick={() => upd({ certifications: [...cv.certifications, { name: "", issuer: "", year: "" }] })}
          className="w-full py-3 border border-dashed border-[#2E2E2E] text-xs text-[#9A9A9A] hover:border-[#FF4D00] hover:text-[#FF4D00] transition-colors flex items-center justify-center gap-2 rounded-sm">
          <Plus size={13} /> {u("addCert")}
        </button>
      </div>
    ),
    languages: (
      <div className="space-y-3">
        {cv.languages.map((l, i) => (
          <div key={i} className="flex items-center gap-3">
            <select value={l.language} onChange={e => updLang(i, "language", e.target.value)}
              className="flex-1 bg-[#1C1C1C] border border-[#2E2E2E] text-[#F5F0EB] text-sm px-3 py-2 focus:outline-none focus:border-[#FF4D00] transition-colors">
              <option value="">{u("language")}…</option>
              {LANGUAGES.map(ln => <option key={ln} value={ln}>{ln}</option>)}
            </select>
            <select value={l.level} onChange={e => updLang(i, "level", e.target.value)}
              className="bg-[#1C1C1C] border border-[#2E2E2E] text-[#F5F0EB] text-sm px-3 py-2 focus:outline-none focus:border-[#FF4D00] transition-colors">
              {LANGUAGE_LEVELS.map(lv => <option key={lv} value={lv}>{lv}</option>)}
            </select>
            <button onClick={() => upd({ languages: cv.languages.filter((_, j) => j !== i) })}
              className="text-[#9A9A9A] hover:text-red-400 transition-colors" aria-label="Remove">
              <X size={14} />
            </button>
          </div>
        ))}
        <button onClick={() => upd({ languages: [...cv.languages, { language: "", level: LANGUAGE_LEVELS[1] }] })}
          className="text-xs text-[#9A9A9A] hover:text-[#FF4D00] transition-colors flex items-center gap-1">
          <Plus size={11} /> {u("addLanguage")}
        </button>
      </div>
    ),
    projects: (
      <div className="space-y-4">
        {cv.projects.map((proj, i) => (
          <div key={i} className="border border-[#2E2E2E] rounded-sm p-3 space-y-3 bg-[#1C1C1C]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9A9A9A]">{i + 1}</span>
              <button onClick={() => upd({ projects: cv.projects.filter((_, j) => j !== i) })}
                className="text-xs text-[#9A9A9A] hover:text-red-400 transition-colors flex items-center gap-1">
                <X size={11} /> {u("remove")}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={u("projName")} value={proj.name} onChange={v => updProj(i, "name", v)} />
              <Field label={u("year")} value={proj.year ?? ""} onChange={v => updProj(i, "year", v)} />
              <Field label="URL" value={proj.url ?? ""} onChange={v => updProj(i, "url", v)} />
            </div>
            <Field label={u("projDesc")} value={proj.description} onChange={v => updProj(i, "description", v)} multiline />
          </div>
        ))}
        <button onClick={() => upd({ projects: [...cv.projects, { name: "", description: "", url: "", year: "" }] })}
          className="w-full py-3 border border-dashed border-[#2E2E2E] text-xs text-[#9A9A9A] hover:border-[#FF4D00] hover:text-[#FF4D00] transition-colors flex items-center justify-center gap-2 rounded-sm">
          <Plus size={13} /> {u("addProject")}
        </button>
      </div>
    ),
    keywords: (
      <div className="space-y-4">
        <p className="text-xs text-[#9A9A9A]">{u("keywordsSub")}</p>
        {(["technical", "soft", "industry"] as const).map(bucket => (
          <div key={bucket}>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#9A9A9A] mb-2">{u(bucket)}</p>
            <div className="flex flex-wrap gap-2">
              {keywords[bucket].map((k, i) => <Pill key={i} label={k} onRemove={() => removeKw(bucket, i)} />)}
              <AddPill placeholder={u("add")} onAdd={v => addKw(bucket, v)} />
            </div>
          </div>
        ))}
      </div>
    ),
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  const orderedSections = sectionOrder
    .map(id => allSections.find(s => s.id === id)!)
    .filter(Boolean);

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h2 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
          {u("reviewing")}
        </h2>
        <p className="text-[#9A9A9A] text-sm">{u("reviewSub")}</p>
        <p className="text-xs text-[#9A9A9A] mt-1 flex items-center gap-1">
          <GripVertical size={11} /> {u("dragHint")}
        </p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {orderedSections.map(section => {
              const isOptional = !!section.optional;
              const isEnabled = !isOptional || enabledOptional[section.id];
              const label = section.label(cv);

              const rightSlot = isOptional ? (
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <span className="text-xs text-[#9A9A9A]">{u("enableSection")}</span>
                  <Toggle
                    enabled={enabledOptional[section.id]}
                    onChange={v => setEnabledOptional(prev => ({ ...prev, [section.id]: v }))}
                    label={label}
                  />
                </div>
              ) : undefined;

              return (
                <SortableSection
                  key={section.id}
                  id={section.id}
                  title={label}
                  defaultOpen={section.id === "basics"}
                  rightSlot={rightSlot}
                >
                  {isEnabled
                    ? sectionContent[section.id]
                    : <p className="text-xs text-[#9A9A9A] italic">
                        {u("sectionDisabled")}
                      </p>
                  }
                </SortableSection>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex items-center gap-4 pt-2">
        <button onClick={onBack}
          className="px-6 py-4 text-sm text-[#9A9A9A] hover:text-[#F5F0EB] transition-colors border border-[#2E2E2E] hover:border-[#9A9A9A]"
          style={{ fontFamily: "var(--font-body)" }}>
          {u("back")}
        </button>
        <button
          onClick={() => {
            // Strip disabled optional sections before proceeding
            const finalCv = {
              ...cv,
              languages: enabledOptional.languages ? cv.languages : [],
              projects: enabledOptional.projects ? cv.projects : [],
            };
            onNext(finalCv, keywords);
          }}
          className="group inline-flex items-center gap-3 px-8 py-4 text-sm font-semibold text-[#111111] bg-[#FF4D00] hover:bg-[#FF8C42] transition-colors duration-200"
          style={{ fontFamily: "var(--font-body)" }}>
          {u("looksGood")}
          <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
        </button>
      </div>
    </div>
  );
}

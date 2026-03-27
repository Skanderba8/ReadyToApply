"use client";

import { useLang } from "@/lib/i18n";

interface StepTemplateProps {
  selectedTemplate: string;
  onTemplateChange: (template: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepTemplate({ selectedTemplate, onTemplateChange, onNext, onBack }: StepTemplateProps) {
  const { u } = useLang();

  const TEMPLATES = [
    { id: "classic", nameKey: "classic", descKey: "classicDesc", preview: (
      <div className="mb-6 p-4 bg-[#1C1C1C] h-32 flex flex-col justify-center gap-2">
        <div className="h-2 w-1/2 bg-[#2E2E2E] rounded-sm mx-auto" />
        <div className="h-1 w-3/4 bg-[#2E2E2E] rounded-sm mx-auto" />
        <div className="mt-2 space-y-1">
          <div className="h-1 w-full bg-[#2E2E2E] rounded-sm" />
          <div className="h-1 w-5/6 bg-[#2E2E2E] rounded-sm" />
          <div className="h-1 w-4/6 bg-[#2E2E2E] rounded-sm" />
        </div>
      </div>
    )},
    { id: "modern", nameKey: "modern", descKey: "modernDesc", preview: (
      <div className="mb-6 h-32 flex flex-col overflow-hidden bg-[#1C1C1C]">
        <div className="bg-[#1F4E79] px-3 py-2 flex flex-col gap-1 items-center">
          <div className="h-2 w-2/5 bg-[#FFFFFF33] rounded-sm" />
          <div className="h-1 w-3/5 bg-[#FFFFFF22] rounded-sm" />
        </div>
        <div className="flex-1 p-3 space-y-1.5">
          <div className="h-1.5 w-1/3 bg-[#2E75B6] rounded-sm" />
          <div className="h-1 w-full bg-[#2E2E2E] rounded-sm" />
          <div className="h-1 w-5/6 bg-[#2E2E2E] rounded-sm" />
        </div>
      </div>
    )},
    { id: "compact", nameKey: "compact", descKey: "compactDesc", preview: (
      <div className="mb-6 p-3 bg-[#1C1C1C] h-32 flex flex-col justify-start gap-1">
        <div className="h-1.5 w-2/5 bg-[#2E2E2E] rounded-sm mx-auto" />
        <div className="h-1 w-4/5 bg-[#2E2E2E] rounded-sm mx-auto" />
        <div className="mt-1 space-y-0.5">
          {[...Array(5)].map((_, i) => <div key={i} className="h-1 w-full bg-[#2E2E2E] rounded-sm" />)}
        </div>
      </div>
    )},
  ];

  return (
    <div className="animate-fade-up">
      <h2 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>{u("chooseTemplate")}</h2>
      <p className="text-[#9A9A9A] mb-8 text-sm">{u("templateSub")}</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#2E2E2E]">
        {TEMPLATES.map((tpl) => (
          <button key={tpl.id} onClick={() => onTemplateChange(tpl.id)}
            className="relative bg-[#111111] p-6 text-left transition-all duration-200"
            style={{ border: selectedTemplate === tpl.id ? "1px solid #FF4D00" : "1px solid transparent" }}
            aria-pressed={selectedTemplate === tpl.id}>
            {selectedTemplate === tpl.id && (
              <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#FF4D00]" aria-hidden="true" />
            )}
            {tpl.preview}
            <p className="text-sm font-bold text-[#F5F0EB] mb-1" style={{ fontFamily: "var(--font-display)" }}>{u(tpl.nameKey)}</p>
            <p className="text-xs text-[#9A9A9A]">{u(tpl.descKey)}</p>
          </button>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-4">
        <button onClick={onBack}
          className="px-6 py-4 text-sm text-[#9A9A9A] hover:text-[#F5F0EB] transition-colors border border-[#2E2E2E] hover:border-[#9A9A9A]"
          style={{ fontFamily: "var(--font-body)" }}>
          {u("back")}
        </button>
        <button onClick={onNext}
          className="group inline-flex items-center gap-3 px-8 py-4 text-sm font-semibold text-[#111111] bg-[#FF4D00] hover:bg-[#FF8C42] transition-colors duration-200"
          style={{ fontFamily: "var(--font-body)" }}>
          {u("generateBtn")}
          <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
        </button>
      </div>
    </div>
  );
}

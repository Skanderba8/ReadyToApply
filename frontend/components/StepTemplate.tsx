"use client";

interface StepTemplateProps {
  selectedTemplate: string;
  onTemplateChange: (template: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const TEMPLATES = [
  {
    id: "classic",
    name: "Classic",
    description: "Clean, structured, ATS-optimised.",
    available: true,
    preview: (
      <div className="mb-6 p-4 bg-[#1C1C1C] h-32 flex flex-col justify-center gap-2">
        <div className="h-2 w-1/2 bg-[#2E2E2E] rounded-sm mx-auto" />
        <div className="h-1 w-3/4 bg-[#2E2E2E] rounded-sm mx-auto" />
        <div className="mt-2 space-y-1">
          <div className="h-1 w-full bg-[#2E2E2E] rounded-sm" />
          <div className="h-1 w-5/6 bg-[#2E2E2E] rounded-sm" />
          <div className="h-1 w-4/6 bg-[#2E2E2E] rounded-sm" />
        </div>
      </div>
    ),
  },
  {
    id: "modern",
    name: "Modern",
    description: "Bold navy header, accent rules.",
    available: true,
    preview: (
      <div className="mb-6 h-32 flex flex-col overflow-hidden bg-[#1C1C1C]">
        {/* navy header strip */}
        <div className="bg-[#1F4E79] px-3 py-2 flex flex-col gap-1 items-center">
          <div className="h-2 w-2/5 bg-[#FFFFFF33] rounded-sm" />
          <div className="h-1 w-3/5 bg-[#FFFFFF22] rounded-sm" />
        </div>
        {/* body lines */}
        <div className="flex-1 p-3 space-y-1.5">
          <div className="h-1.5 w-1/3 bg-[#2E75B6] rounded-sm" />
          <div className="h-1 w-full bg-[#2E2E2E] rounded-sm" />
          <div className="h-1 w-5/6 bg-[#2E2E2E] rounded-sm" />
          <div className="h-1 w-4/6 bg-[#2E2E2E] rounded-sm" />
        </div>
      </div>
    ),
  },
  {
    id: "compact",
    name: "Compact",
    description: "Maximum content, minimal space.",
    available: true,
    preview: (
      <div className="mb-6 p-3 bg-[#1C1C1C] h-32 flex flex-col justify-start gap-1">
        <div className="h-1.5 w-2/5 bg-[#2E2E2E] rounded-sm mx-auto" />
        <div className="h-1 w-4/5 bg-[#2E2E2E] rounded-sm mx-auto" />
        <div className="mt-1 space-y-0.5">
          <div className="h-1 w-full bg-[#2E2E2E] rounded-sm" />
          <div className="h-1 w-full bg-[#2E2E2E] rounded-sm" />
          <div className="h-1 w-5/6 bg-[#2E2E2E] rounded-sm" />
          <div className="h-1 w-full bg-[#2E2E2E] rounded-sm" />
          <div className="h-1 w-4/6 bg-[#2E2E2E] rounded-sm" />
        </div>
      </div>
    ),
  },
];

export default function StepTemplate({
  selectedTemplate,
  onTemplateChange,
  onNext,
  onBack,
}: StepTemplateProps) {
  return (
    <div className="animate-fade-up">
      <h2
        className="text-3xl md:text-4xl font-bold mb-2"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Choose a template
      </h2>
      <p className="text-[#9A9A9A] mb-8 text-sm">
        All templates are ATS-clean and formatted for hiring systems.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#2E2E2E]">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => template.available && onTemplateChange(template.id)}
            disabled={!template.available}
            className="relative bg-[#111111] p-6 text-left transition-all duration-200 group"
            style={{
              border:
                selectedTemplate === template.id
                  ? "1px solid #FF4D00"
                  : "1px solid transparent",
              cursor: template.available ? "pointer" : "default",
              opacity: template.available ? 1 : 0.5,
            }}
            aria-pressed={selectedTemplate === template.id}
          >
            {/* Selected indicator dot */}
            {selectedTemplate === template.id && (
              <div
                className="absolute top-3 right-3 w-2 h-2 rounded-full"
                style={{ backgroundColor: "#FF4D00" }}
                aria-hidden="true"
              />
            )}

            {/* Template preview */}
            {template.preview}

            <p
              className="text-sm font-bold text-[#F5F0EB] mb-1"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {template.name}
            </p>
            <p className="text-xs text-[#9A9A9A]">{template.description}</p>

            {!template.available && (
              <span
                className="absolute top-3 right-3 text-xs text-[#9A9A9A] border border-[#2E2E2E] px-2 py-0.5"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Soon
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={onBack}
          className="px-6 py-4 text-sm text-[#9A9A9A] hover:text-[#F5F0EB] transition-colors border border-[#2E2E2E] hover:border-[#9A9A9A]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          className="group inline-flex items-center gap-3 px-8 py-4 text-sm font-semibold text-[#111111] bg-[#FF4D00] hover:bg-[#FF8C42] transition-colors duration-200"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Continue
          <span className="transition-transform duration-200 group-hover:translate-x-1">
            →
          </span>
        </button>
      </div>
    </div>
  );
}
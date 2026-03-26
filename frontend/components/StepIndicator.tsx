interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const STEP_LABELS = ["Profile", "Job", "Template", "Generate"];

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="h-px bg-[#2E2E2E] w-full mb-6">
        <div
          className="h-px bg-[#FF4D00] transition-all duration-500 ease-out"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>

      {/* Step labels */}
      <div className="flex items-center justify-between">
        {STEP_LABELS.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                style={{
                  backgroundColor: isCompleted || isCurrent ? "#FF4D00" : "transparent",
                  border: isCompleted || isCurrent ? "none" : "1px solid #2E2E2E",
                  color: isCompleted || isCurrent ? "#111111" : "#9A9A9A",
                  fontFamily: "var(--font-display)",
                }}
              >
                {isCompleted ? "✓" : stepNumber}
              </div>
              <span
                className="text-xs hidden sm:block transition-colors duration-300"
                style={{
                  color: isCurrent ? "#F5F0EB" : isCompleted ? "#FF4D00" : "#9A9A9A",
                  fontFamily: "var(--font-display)",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
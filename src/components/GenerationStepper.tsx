import { cn } from "../lib/utils";
import type { GenerationStep } from "../lib/generation";

interface GenerationStepperProps {
  steps: GenerationStep[];
  message?: string;
  hint?: string;
  errorMessage?: string;
  technicalNote?: string;
}

export function GenerationStepper({
  steps,
  message,
  hint,
  errorMessage,
  technicalNote,
}: GenerationStepperProps) {
  const showTechnical = import.meta.env.DEV && technicalNote;

  return (
    <>
      <div className="mt-4 space-y-2">
        {steps.map((step, i) => (
          <div key={step.id}>
            <div className="flex items-center gap-3">
              {step.status === "done" ? (
                <span className="material-symbols-outlined text-[20px] text-green-600">
                  check_circle
                </span>
              ) : step.status === "failed" ? (
                <span className="material-symbols-outlined text-[20px] text-red-600">
                  error
                </span>
              ) : step.status === "active" ? (
                <span className="material-symbols-outlined text-[20px] text-primary animate-spin">
                  sync
                </span>
              ) : (
                <span className="material-symbols-outlined text-[20px] text-outline-variant">
                  radio_button_unchecked
                </span>
              )}
              <span
                className={cn(
                  "font-body-md text-body-md",
                  step.status === "done" && "text-green-700",
                  step.status === "failed" && "text-red-700",
                  step.status === "active" && "text-primary font-semibold",
                  step.status === "pending" && "text-outline-variant",
                )}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="ml-[10px] w-px h-3 bg-outline-variant/30 my-1" />
            )}
          </div>
        ))}
      </div>

      {message && (
        <p className="font-body-md text-body-md text-on-surface-variant mt-3 italic">
          {message}
        </p>
      )}

      {hint && (
        <p className="font-body-sm text-body-sm text-on-surface-variant/80 mt-2">
          {hint}
        </p>
      )}

      {errorMessage && (
        <p className="font-body-sm text-body-sm text-red-700/80 mt-2">
          {errorMessage}
        </p>
      )}

      {showTechnical && (
        <p className="font-mono text-xs text-on-surface-variant/60 mt-2 break-all">
          {technicalNote}
        </p>
      )}
    </>
  );
}

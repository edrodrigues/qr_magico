import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") onCancel();
      };
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleKey);
        document.body.style.overflow = "";
      };
    }
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div
        ref={dialogRef}
        className="relative w-full md:w-auto md:min-w-[360px] md:max-w-md bg-surface rounded-t-2xl md:rounded-2xl shadow-2xl p-6 animate-slide-up"
      >
        <div className="flex items-start gap-4 mb-4">
          <span
            className={`material-symbols-outlined text-[28px] mt-0.5 ${
              variant === "danger" ? "text-error" : "text-primary"
            }`}
          >
            {variant === "danger" ? "delete_forever" : "help_outline"}
          </span>
          <div>
            <h3 className="font-title-lg text-title-lg text-on-surface mb-1">{title}</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-variant transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-lg font-label-md text-label-md text-white transition-all ${
              variant === "danger"
                ? "bg-error hover:bg-red-700"
                : "bg-primary hover:brightness-110"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

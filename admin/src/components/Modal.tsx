import { X } from "lucide-react";
import type { ReactNode } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

export function Modal({ title, onClose, children, wide }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className={`relative z-10 max-h-[90vh] w-full ${wide ? "max-w-2xl" : "max-w-md"} overflow-y-auto rounded-card bg-white p-6 shadow-xl`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-ink-muted hover:bg-surface-alt">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

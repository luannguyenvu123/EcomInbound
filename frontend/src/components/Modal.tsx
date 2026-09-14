interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, subtitle, icon = 'sync_alt', children, footer }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-margin animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest rounded-xl max-w-xl w-full shadow-2xl overflow-hidden animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-space-xl py-space-lg bg-surface-container-low/50 flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">{icon}</span>
            </div>
            <div className="flex flex-col">
              <h3 className="font-semibold text-headline-md text-on-surface">{title}</h3>
              {subtitle && (
                <span className="text-label-sm text-on-surface-variant">{subtitle}</span>
              )}
            </div>
          </div>
          <button
            className="w-8 h-8 rounded-lg hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center transition-colors"
            onClick={onClose}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-space-xl space-y-space-md">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-space-xl py-space-md bg-surface-container-low/40 flex items-center justify-end gap-space-sm">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

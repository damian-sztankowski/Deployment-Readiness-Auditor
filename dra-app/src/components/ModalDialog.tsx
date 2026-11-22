import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  maxWidthClass?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Accessible Native Modal Dialog (`<dialog>`)
 * Follows modern-web-guidance (`dialog`, `light-dismiss-a-dialog`):
 * - Opened via `dialog.showModal()` for native top-layer promotion, inert background, Esc handling, and focus restoration.
 * - Uses declarative `closedby="any"` with a pointerdown/pointerup bounding-rect fallback for browsers lacking `closedBy`.
 * - Avoids redundant `role="dialog"` / `aria-modal` and avoids locking `body` scroll via `overflow: hidden`.
 */
export const ModalDialog: React.FC<ModalDialogProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  maxWidthClass = 'max-w-3xl',
  children,
  footer
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = '';
      onClose();
    };

    dialog.addEventListener('close', handleClose);

    // Fallback light-dismiss for browsers where HTMLDialogElement.prototype.closedBy is not yet supported
    let cleanupFallback: (() => void) | undefined;
    if (typeof HTMLDialogElement !== 'undefined' && !('closedBy' in HTMLDialogElement.prototype)) {
      let pressedOutside = false;
      const isOutside = (e: PointerEvent) => {
        const r = dialog.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      const onPointerDown = (e: PointerEvent) => {
        pressedOutside = e.target === dialog && isOutside(e);
      };
      const onPointerUp = (e: PointerEvent) => {
        if (pressedOutside && e.target === dialog && isOutside(e)) {
          dialog.close();
        }
        pressedOutside = false;
      };
      dialog.addEventListener('pointerdown', onPointerDown);
      dialog.addEventListener('pointerup', onPointerUp);
      cleanupFallback = () => {
        dialog.removeEventListener('pointerdown', onPointerDown);
        dialog.removeEventListener('pointerup', onPointerUp);
      };
    }

    return () => {
      dialog.removeEventListener('close', handleClose);
      cleanupFallback?.();
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      {...({ closedby: 'any' } as any)}
      className={`w-[calc(100%-2rem)] ${maxWidthClass} max-h-[90vh] m-auto p-0 bg-white dark:bg-[#0a0f1e] text-slate-900 dark:text-slate-100 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden open:flex open:flex-col`}
    >
      <div className="px-6 md:px-8 py-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#111827]/50 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          {icon && (
            <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20 shrink-0" aria-hidden="true">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h2 id={titleId} className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <form method="dialog" className="shrink-0">
          <button
            type="submit"
            value="close"
            aria-label="Close dialog"
            className="p-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8">{children}</div>

      {footer && (
        <div className="px-6 md:px-8 py-4 bg-slate-50 dark:bg-[#111827]/40 border-t border-slate-100 dark:border-slate-800/80 shrink-0">
          {footer}
        </div>
      )}
    </dialog>
  );
};

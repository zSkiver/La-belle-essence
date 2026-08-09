"use client";

import { useCallback, useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type DialogPlacement = "center" | "bottom" | "right";

const placements: Record<DialogPlacement, string> = {
  // Centrado e com folga em cima e embaixo: o diálogo nunca encosta nas bordas
  // da tela, o que deixa claro que existe página por trás.
  center: "m-auto max-h-[86dvh] w-[calc(100%-2rem)] max-w-2xl sm:w-[calc(100%-4rem)]",
  bottom: "mt-auto mb-0 ml-auto mr-auto max-h-[88dvh] w-full max-w-full sm:m-auto sm:max-w-xl",
  right: "ml-auto mr-0 my-0 h-dvh max-h-dvh w-full max-w-md",
};

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** Título acessível. Renderizado visualmente por quem usa o componente. */
  title: string;
  /** Oculta o título visualmente quando o conteúdo já o apresenta. */
  hideTitle?: boolean;
  placement?: DialogPlacement;
  children: ReactNode;
  className?: string;
}

/**
 * Diálogo modal sobre o elemento nativo `<dialog>`: o navegador cuida do
 * aprisionamento de foco, da camada superior e do fechamento por Escape.
 * Complementamos com fechamento por clique externo e trava de rolagem.
 */
export function Dialog({
  open,
  onClose,
  title,
  hideTitle = true,
  placement = "center",
  children,
  className,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const element = dialogRef.current;
    if (!element) return;

    if (open && !element.open) {
      element.showModal();
    } else if (!open && element.open) {
      element.close();
    }
  }, [open]);

  // Trava a rolagem do documento enquanto o diálogo estiver aberto.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const handleCancel = useCallback(
    (event: React.SyntheticEvent<HTMLDialogElement>) => {
      // O estado do React continua sendo a fonte da verdade.
      event.preventDefault();
      onClose();
    },
    [onClose],
  );

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDialogElement>) => {
      if (event.target === dialogRef.current) onClose();
    },
    [onClose],
  );

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      onClose={() => {
        if (open) onClose();
      }}
      onClick={handleBackdropClick}
      className={cn(
        "bg-transparent p-0 text-ink backdrop:bg-ink/55 backdrop:backdrop-blur-[3px]",
        "open:flex",
        placements[placement],
        className,
      )}
    >
      {open ? (
        <div
          className={cn(
            "relative flex max-h-[inherit] w-full flex-col overflow-hidden border border-line bg-surface-raised shadow-[0_24px_80px_-32px_rgba(46,33,30,0.45)]",
            placement === "right" && "h-dvh",
          )}
        >
          <h2 id={titleId} className={cn(hideTitle && "sr-only")}>
            {title}
          </h2>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}

/** Botão de fechar padronizado, com área de toque adequada. */
export function DialogCloseButton({ onClose, label = "Fechar" }: { onClose: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label={label}
      className="inline-flex size-11 shrink-0 items-center justify-center text-ink-faint transition-colors hover:text-ink"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2 2 L14 14 M14 2 L2 14" stroke="currentColor" strokeWidth="1.25" />
      </svg>
    </button>
  );
}

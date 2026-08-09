"use client";

import { useEffect, useState } from "react";
import { WhatsappGlyph } from "@/components/icons";
import { useWhatsapp } from "@/components/whatsapp/whatsapp-provider";
import { cn } from "@/lib/cn";

/**
 * Botão flutuante de WhatsApp. Aparece depois que o visitante passa da hero,
 * para não competir com a chamada principal.
 */
export function WhatsappFab() {
  const { requestWhatsapp } = useWhatsapp();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => requestWhatsapp({ source: "floating_button" })}
      aria-label="Falar com uma consultora no WhatsApp"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={cn(
        "fixed right-4 bottom-4 z-40 inline-flex size-14 items-center justify-center bg-forest text-ink-inverse shadow-[0_18px_44px_-18px_rgba(31,68,54,0.75)] transition-[opacity,transform] duration-500 ease-[var(--ease-silk)] hover:scale-105 hover:bg-forest/90 sm:right-6 sm:bottom-6",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <WhatsappGlyph width={22} height={22} />
    </button>
  );
}

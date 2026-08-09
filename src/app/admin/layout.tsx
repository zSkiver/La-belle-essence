import type { Metadata } from "next";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Painel administrativo",
  // O painel nunca deve ser indexado.
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface text-ink">
      <ToastProvider>{children}</ToastProvider>
    </div>
  );
}

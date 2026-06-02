import { Car } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/features/auth/components/auth-actions";

type AppShellProps = Readonly<{
  children: React.ReactNode;
  userEmail?: string | null;
  userName?: string | null;
}>;

export function AppShell({ children, userEmail, userName }: AppShellProps) {
  const userLabel = userName ?? userEmail ?? "Authenticated user";

  return (
    <div className="min-h-screen overflow-hidden bg-black text-white">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(185,28,28,0.22),transparent_32%),radial-gradient(circle_at_top_right,rgba(63,63,70,0.34),transparent_30%),linear-gradient(180deg,#09090b_0%,#000_58%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <header className="flex items-center justify-between gap-3 py-2" aria-label="Application header">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] shadow-2xl shadow-red-950/40">
              <Car className="size-5 text-red-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.32em] text-zinc-400 uppercase">
                Tesla Web
              </p>
              <p className="text-sm font-medium text-zinc-100">Wrist Vehicle Bridge</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium text-zinc-300">{userLabel}</p>
              <p className="text-[10px] font-semibold tracking-[0.24em] text-zinc-500 uppercase">Session active</p>
            </div>
            <Badge variant="outline" className="border-red-400/25 bg-red-500/10 text-red-100">
              Mock UI
            </Badge>
            <SignOutButton />
          </div>
        </header>

        <main className="flex flex-1 flex-col py-5 sm:py-12">{children}</main>

        <footer className="border-t border-white/10 py-4 text-xs text-zinc-500">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span>Auth enabled. API client and backend calls stay server-side.</span>
            <span>Dark mode locked by default.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

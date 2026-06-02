import { Car, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SignInWithGoogleButton } from "@/features/auth/components/auth-actions";

export function SignInScreen() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(185,28,28,0.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(63,63,70,0.28),transparent_32%),linear-gradient(180deg,#09090b_0%,#000_62%)]"
        aria-hidden="true"
      />

      <section className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-2xl text-center">
          <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] shadow-2xl shadow-red-950/40">
            <Car className="size-7 text-red-400" aria-hidden="true" />
          </div>

          <Badge className="mb-5 border border-red-400/20 bg-red-500/10 text-red-100 hover:bg-red-500/10">
            Private dashboard
          </Badge>

          <h1 className="text-5xl font-semibold tracking-[-0.055em] text-balance text-white sm:text-6xl">
            Authenticate before entering the vehicle bridge.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-zinc-300">
            The Tesla-style mock dashboard is protected behind Auth.js SSO. No vehicle API calls are made from this screen.
          </p>

          <div className="mt-8 flex justify-center">
            <SignInWithGoogleButton />
          </div>
        </div>

        <Card className="mx-auto mt-10 w-full max-w-2xl border-white/10 bg-zinc-950/70 text-white shadow-2xl shadow-black/50 backdrop-blur-xl">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-200">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </div>
            <div className="text-left">
              <p className="font-medium text-zinc-100">Protected by Google SSO</p>
              <p className="mt-1 text-sm leading-6 text-zinc-400">
                If an email allowlist is configured, only listed accounts can create a session.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

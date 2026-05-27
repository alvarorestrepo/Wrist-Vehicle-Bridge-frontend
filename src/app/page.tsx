import { BatteryCharging, Car, LockKeyhole, RadioTower } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#2a2f3a_0%,#09090b_42%,#000_100%)] px-5 py-6 text-white sm:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col justify-between gap-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 shadow-2xl shadow-red-500/10">
              <Car className="size-5 text-red-400" aria-hidden="true" />
            </div>
            <span className="text-sm font-medium tracking-[0.28em] text-zinc-300 uppercase">
              Tesla Web
            </span>
          </div>
          <Badge variant="outline" className="border-white/15 bg-white/5 text-zinc-300">
            Phase 1
          </Badge>
        </header>

        <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Badge className="bg-red-500/10 text-red-200 hover:bg-red-500/10">
              Private vehicle dashboard scaffold
            </Badge>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.05em] text-balance sm:text-7xl">
                Wrist Vehicle Bridge
              </h1>
              <p className="max-w-xl text-lg leading-8 text-zinc-300 sm:text-xl">
                A dark, mobile-first control surface is being prepared for your
                Tesla gateway. The authenticated dashboard comes in the next
                phase.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="rounded-full bg-white px-6 text-black hover:bg-zinc-200">
                Dashboard coming next
              </Button>
              <Button
                variant="outline"
                className="rounded-full border-white/15 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white"
              >
                Backend not connected yet
              </Button>
            </div>
          </div>

          <Card className="border-white/10 bg-black/45 text-white shadow-2xl shadow-black/60 backdrop-blur-xl">
            <CardHeader>
              <CardDescription className="text-zinc-400">
                Placeholder status preview
              </CardDescription>
              <CardTitle className="text-2xl">Model Y Bridge</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Battery", value: "Pending", icon: BatteryCharging },
                { label: "Lock", value: "Pending", icon: LockKeyhole },
                { label: "Connection", value: "No backend calls", icon: RadioTower },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex items-center gap-3 text-zinc-300">
                    <item.icon className="size-5 text-red-300" aria-hidden="true" />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-sm font-medium text-zinc-100">
                    {item.value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

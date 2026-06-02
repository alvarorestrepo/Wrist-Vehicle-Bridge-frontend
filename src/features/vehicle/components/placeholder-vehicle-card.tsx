import { BatteryCharging, CarFront, LockKeyhole, RadioTower, Snowflake } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const statusItems = [
  { label: "Battery", value: "74% mock", icon: BatteryCharging },
  { label: "Lock", value: "Locked preview", icon: LockKeyhole },
  { label: "Climate", value: "Off preview", icon: Snowflake },
  { label: "Connection", value: "No backend call", icon: RadioTower },
];

export function PlaceholderVehicleCard() {
  return (
    <Card className="border-white/10 bg-zinc-950/70 text-white shadow-2xl shadow-black/60 backdrop-blur-xl">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardDescription className="text-zinc-400">Placeholder vehicle</CardDescription>
            <CardTitle className="mt-2 text-2xl tracking-[-0.03em]">Model Y Bridge</CardTitle>
          </div>
          <Badge variant="outline" className="border-white/10 bg-white/[0.04] text-zinc-300">
            offline mock
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(145deg,rgba(39,39,42,0.95),rgba(0,0,0,0.9))] p-5">
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-red-400/60 to-transparent" />
          <CarFront className="mx-auto size-28 text-zinc-200 drop-shadow-[0_0_24px_rgba(239,68,68,0.18)]" aria-hidden="true" />
          <p className="mt-3 text-center text-sm text-zinc-400">
            Real status will land after auth and server-side API wiring.
          </p>
        </div>

        <dl className="grid gap-3">
          {statusItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-4"
            >
              <dt className="flex items-center gap-3 text-zinc-300">
                <item.icon className="size-5 text-red-300" aria-hidden="true" />
                <span>{item.label}</span>
              </dt>
              <dd className="text-sm font-medium text-zinc-100">{item.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

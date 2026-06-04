import {
  BatteryCharging,
  CarFront,
  LockKeyhole,
  RadioTower,
  Snowflake,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getVehicleStatus,
  TeslaApiClientError,
  type TeslaApiClientErrorCode,
  type VehicleStatus,
} from "@/features/vehicle/server";

type SafeVehicleStatusErrorCode = TeslaApiClientErrorCode | "unknown";
type VehicleStatusCardState =
  | { kind: "status"; status: VehicleStatus }
  | { kind: "error"; code: SafeVehicleStatusErrorCode };

const technicalErrorMessages: Partial<Record<SafeVehicleStatusErrorCode, string>> = {
  unauthorized: "Vehicle status is not available for this session.",
  rate_limited: "Vehicle status is temporarily rate limited. Try again later.",
  missing_tesla_scope: "Vehicle permissions are missing for status access.",
  timeout: "Vehicle status took too long to respond. Try again shortly.",
  request_failed: "Vehicle status could not be reached. Try again shortly.",
  invalid_response: "Vehicle status returned an unexpected response.",
  http_error: "Vehicle status is temporarily unavailable.",
  unknown: "Vehicle status is temporarily unavailable.",
};

const fallbackTechnicalErrorMessage = "Vehicle status is temporarily unavailable.";

export async function VehicleStatusCard() {
  const state = await loadVehicleStatusCardState();

  if (state.kind === "error") {
    return (
      <StatusCardShell
        badgeLabel="Status error"
        badgeClassName="border-red-300/20 bg-red-500/10 text-red-100"
        connectionTone="text-red-200"
        description="Live vehicle status"
        title="Model Y Bridge"
        message={technicalErrorMessages[state.code] ?? fallbackTechnicalErrorMessage}
        items={[
          { label: "Battery", value: "—", icon: BatteryCharging },
          { label: "Lock", value: "—", icon: LockKeyhole },
          { label: "Climate", value: "—", icon: Snowflake },
          { label: "Connection", value: "Unavailable", icon: RadioTower },
        ]}
      />
    );
  }

  const { status } = state;

  if (!status.vehicleOnline) {
    return (
      <StatusCardShell
        badgeLabel="Unavailable"
        badgeClassName="border-amber-300/20 bg-amber-400/10 text-amber-100"
        connectionTone="text-amber-200"
        description="Live vehicle status"
        title="Model Y Bridge"
        message="Vehicle unavailable. Try the Wake command below."
        lastUpdatedAt={status.lastUpdatedAt}
        items={[
          { label: "Battery", value: "—", icon: BatteryCharging },
          { label: "Lock", value: "—", icon: LockKeyhole },
          { label: "Climate", value: "—", icon: Snowflake },
          { label: "Connection", value: "Unavailable", icon: RadioTower },
        ]}
      />
    );
  }

  return (
    <StatusCardShell
      badgeLabel="Online"
      badgeClassName="border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
      connectionTone="text-emerald-200"
      description="Live vehicle status"
      title="Model Y Bridge"
      message="Status retrieved securely from the server."
      lastUpdatedAt={status.lastUpdatedAt}
      batteryPercent={status.batteryPercent}
      items={[
        {
          label: "Battery",
          value: `${status.batteryPercent}%`,
          icon: BatteryCharging,
        },
        { label: "Lock", value: status.locked ? "Locked" : "Unlocked", icon: LockKeyhole },
        { label: "Climate", value: status.climateOn ? "On" : "Off", icon: Snowflake },
        { label: "Connection", value: "Online", icon: RadioTower },
      ]}
    />
  );
}

async function loadVehicleStatusCardState(): Promise<VehicleStatusCardState> {
  try {
    const status = await getVehicleStatus();

    return { kind: "status", status };
  } catch (error) {
    return { kind: "error", code: normalizeStatusError(error) };
  }
}

function StatusCardShell({
  badgeLabel,
  badgeClassName,
  connectionTone,
  description,
  title,
  message,
  lastUpdatedAt,
  batteryPercent,
  items,
}: {
  badgeLabel: string;
  badgeClassName: string;
  connectionTone: string;
  description: string;
  title: string;
  message: string;
  lastUpdatedAt?: string;
  batteryPercent?: number;
  items: Array<{
    label: string;
    value: string;
    icon: typeof BatteryCharging;
  }>;
}) {
  return (
    <Card className="animate-fade-slide-in border-white/10 bg-zinc-950/70 text-white shadow-2xl shadow-black/60 backdrop-blur-xl">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardDescription className="text-zinc-400">{description}</CardDescription>
            <CardTitle className="mt-2 text-2xl tracking-[-0.03em]">{title}</CardTitle>
          </div>
          <Badge variant="outline" className={badgeClassName}>
            {badgeLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(145deg,rgba(39,39,42,0.95),rgba(0,0,0,0.9))] p-4 sm:p-5">
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-red-400/60 to-transparent" />
          <CarFront
            className="mx-auto size-24 text-zinc-200 drop-shadow-[0_0_24px_rgba(239,68,68,0.18)]"
            aria-hidden="true"
          />
          {typeof batteryPercent === "number" ? (
            <p className="mt-3 text-center text-5xl font-semibold tracking-[-0.06em] text-white">
              {batteryPercent}%
            </p>
          ) : null}
          <p className={`mt-3 text-center text-sm ${connectionTone}`}>{message}</p>
          <p className="mt-2 text-center text-xs text-zinc-500">
            Updated: {formatLastUpdated(lastUpdatedAt)}
          </p>
        </div>

        <dl className="grid gap-2.5 sm:gap-3">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-3.5 sm:p-4"
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

function normalizeStatusError(error: unknown): SafeVehicleStatusErrorCode {
  if (error instanceof TeslaApiClientError) {
    return error.code;
  }

  return "unknown";
}

function formatLastUpdated(lastUpdatedAt?: string) {
  if (!lastUpdatedAt) {
    return "Not available";
  }

  const date = new Date(lastUpdatedAt);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZoneName: "short",
    year: "numeric",
  }).format(date);
}

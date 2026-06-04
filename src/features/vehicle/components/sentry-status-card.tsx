import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HornButton } from "@/features/vehicle/components/horn-button";
import {
  getVehicleSentryStatus,
  TeslaApiClientError,
  type TeslaApiClientErrorCode,
  type VehicleSentryStatus,
} from "@/features/vehicle/server";
import { cn } from "@/lib/utils";
import { AlertTriangle, Camera, RadioTower } from "lucide-react";

type SafeSentryStatusErrorCode = TeslaApiClientErrorCode | "unknown";
type SentryStatusCardState =
  | { kind: "status"; status: VehicleSentryStatus }
  | { kind: "error"; code: SafeSentryStatusErrorCode };

const sentryErrorMessages: Partial<Record<SafeSentryStatusErrorCode, string>> = {
  unauthorized: "Sentry status is not available for this session.",
  rate_limited: "Sentry status is temporarily rate limited. Try again later.",
  missing_tesla_scope: "Vehicle permissions are missing for Sentry status.",
  timeout: "Sentry status took too long to respond. Try again shortly.",
  request_failed: "Sentry status could not reach the backend. Try again shortly.",
  invalid_response: "Sentry status returned an unexpected response.",
  http_error: "Sentry status is temporarily unavailable.",
  vehicle_unavailable: "Vehicle is unavailable for Sentry status.",
  unknown: "Sentry status is temporarily unavailable.",
};

const fallbackSentryErrorMessage = "Sentry status is temporarily unavailable.";

export async function SentryStatusCard() {
  const state = await loadSentryStatusCardState();

  if (state.kind === "error") {
    return (
      <SentryCardShell
        badgeLabel="Status error"
        modeLabel="Unknown"
        modeTone="border-zinc-500/25 bg-zinc-500/10 text-zinc-200"
        message={sentryErrorMessages[state.code] ?? fallbackSentryErrorMessage}
        showHornInitially={false}
      />
    );
  }

  const content = getSentryContent(state.status);
  const canTrustSentryMode =
    state.status.source === "live" && state.status.availabilityReason !== "missing_data";
  const shouldAlarm = state.status.isIncidentLikely && canTrustSentryMode;

  return (
    <SentryCardShell
      badgeLabel={content.badgeLabel}
      modeLabel={content.modeLabel}
      modeTone={content.modeTone}
      message={content.message}
      lastUpdatedAt={state.status.lastUpdatedAt}
      source={state.status.source}
      vehicleOnline={state.status.vehicleOnline}
      showIncidentAlert={shouldAlarm}
      showHornInitially={shouldAlarm}
    />
  );
}

async function loadSentryStatusCardState(): Promise<SentryStatusCardState> {
  const session = await auth();

  if (!session?.user) {
    return { kind: "error", code: "unauthorized" };
  }

  try {
    const status = await getVehicleSentryStatus();

    return { kind: "status", status };
  } catch (error) {
    return { kind: "error", code: normalizeSentryError(error) };
  }
}

function SentryCardShell({
  badgeLabel,
  modeLabel,
  modeTone,
  message,
  lastUpdatedAt,
  source,
  vehicleOnline,
  showIncidentAlert = false,
  showHornInitially,
}: {
  badgeLabel: string;
  modeLabel: string;
  modeTone: string;
  message?: string;
  lastUpdatedAt?: string | null;
  source?: string;
  vehicleOnline?: boolean;
  showIncidentAlert?: boolean;
  showHornInitially: boolean;
}) {
  return (
    <section aria-labelledby="sentry-status-title" className="mt-5 sm:mt-8">
      <Card className="animate-fade-slide-in border-white/10 bg-zinc-950/70 text-white shadow-xl shadow-black/40 backdrop-blur">
        <CardHeader className="px-4 sm:px-6">
          <CardDescription className="text-zinc-400">Sentry Mode monitor</CardDescription>
          <div className="flex items-start justify-between gap-4">
            <CardTitle id="sentry-status-title" className="text-2xl tracking-[-0.03em]">
              Sentry status
            </CardTitle>
            <Badge variant="outline" className={modeTone}>
              {badgeLabel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          {showIncidentAlert ? (
            <div className="flex gap-3 rounded-3xl border border-red-300/30 bg-red-500/15 p-4 text-red-50">
              <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <div className="space-y-1">
                <p className="font-semibold">Possible Sentry incident detected</p>
                <p className="text-sm leading-6 text-red-100/85">
                  Push is best-effort; this alert comes from the current Sentry status query.
                </p>
              </div>
            </div>
          ) : null}

          <div className={cn("rounded-3xl border p-4 sm:p-5", modeTone)}>
            <div className="flex gap-3">
              <Camera className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <div className="space-y-1">
                <p className="font-semibold">Mode: {modeLabel}</p>
                <p className="text-sm leading-6">{message}</p>
              </div>
            </div>
          </div>

          <dl className="grid gap-2.5 sm:grid-cols-3">
            <SentryFact label="Connection" value={vehicleOnline === false ? "Offline" : "Online"} />
            <SentryFact label="Source" value={source ?? "Not available"} />
            <SentryFact label="Updated" value={formatLastUpdated(lastUpdatedAt)} />
          </dl>

          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-zinc-300">
            <RadioTower className="size-4 shrink-0 text-red-300" aria-hidden="true" />
            Status is queried from the backend even if no push notification arrives.
          </div>

          <HornButton showInitially={showHornInitially} />
        </CardContent>
      </Card>
    </section>
  );
}

function SentryFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3.5">
      <dt className="text-xs font-medium tracking-[0.16em] text-zinc-500 uppercase">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-zinc-100">{value}</dd>
    </div>
  );
}

function getSentryContent(status: VehicleSentryStatus) {
  if (status.availabilityReason === "missing_data") {
    return {
      badgeLabel: "Unknown",
      modeLabel: "Unknown",
      modeTone: "border-zinc-500/25 bg-zinc-500/10 text-zinc-200",
      message:
        "Vehicle is online, but Tesla did not report a reliable Sentry Mode value.",
    };
  }

  if (status.sentryMode === "panic") {
    return {
      badgeLabel: "Critical",
      modeLabel: "Panic",
      modeTone: "border-red-300/25 bg-red-500/10 text-red-100",
      message: "Sentry Mode reports a critical state.",
    };
  }

  if (status.sentryMode === "aware") {
    return {
      badgeLabel: "Warning",
      modeLabel: "Aware",
      modeTone: "border-amber-300/25 bg-amber-400/10 text-amber-100",
      message: "Sentry Mode detected activity around the vehicle.",
    };
  }

  if (status.sentryMode === "off" || status.sentryMode === "unknown") {
    return {
      badgeLabel: status.sentryMode === "off" ? "Off" : "Unknown",
      modeLabel: capitalizeMode(status.sentryMode),
      modeTone: "border-zinc-500/25 bg-zinc-500/10 text-zinc-200",
      message: "Sentry Mode is not reporting an active monitoring state.",
    };
  }

  return {
    badgeLabel: status.isActive ? "Active" : "Quiet",
    modeLabel: capitalizeMode(status.sentryMode),
    modeTone: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
    message: "Sentry Mode is available and no incident is currently likely.",
  };
}

function normalizeSentryError(error: unknown): SafeSentryStatusErrorCode {
  if (error instanceof TeslaApiClientError) {
    return error.code;
  }

  return "unknown";
}

function capitalizeMode(mode: VehicleSentryStatus["sentryMode"]) {
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function formatLastUpdated(lastUpdatedAt?: string | null) {
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
  }).format(date);
}

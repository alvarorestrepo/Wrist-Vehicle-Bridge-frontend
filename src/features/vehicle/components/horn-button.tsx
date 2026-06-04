"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { honkHornManually } from "@/features/vehicle/server/actions";
import { cn } from "@/lib/utils";

type HornResult = Awaited<ReturnType<typeof honkHornManually>>;

type ServiceWorkerSentryMessage = {
  type: "sentry_alert";
};

export function HornButton({ showInitially }: { showInitially: boolean }) {
  const [shouldShow, setShouldShow] = useState(
    () => showInitially || hasSentryAlertSearchParam(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [result, setResult] = useState<HornResult | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    function handleServiceWorkerMessage(event: MessageEvent<unknown>) {
      if (isServiceWorkerSentryMessage(event.data)) {
        setShouldShow(true);
      }
    }

    navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
    };
  }, []);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setCooldownSeconds((currentSeconds) => Math.max(0, currentSeconds - 1));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [cooldownSeconds]);

  async function handleHonk() {
    setIsSubmitting(true);
    setResult(null);

    try {
      const hornResult = await honkHornManually();
      setResult(hornResult);

      if (hornResult.status === "cooldown") {
        setCooldownSeconds(hornResult.retryAfterSeconds);
      }
    } catch {
      setResult({
        status: "failed",
        message: "Horn command was rejected. Sign in again and retry.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!shouldShow) {
    return null;
  }

  const isCoolingDown = cooldownSeconds > 0;

  return (
    <div className="space-y-3 rounded-3xl border border-red-300/25 bg-red-500/10 p-4 text-red-50">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="font-semibold">Manual deterrent action available</p>
          <p className="text-sm leading-6 text-red-100/85">
            Horn is only sent when you press the button. Push alerts and incident status never trigger it.
          </p>
        </div>
        <Button
          disabled={isSubmitting || isCoolingDown}
          onClick={() => void handleHonk()}
          className="rounded-full bg-red-500 text-white hover:bg-red-400"
        >
          {isSubmitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
          {isCoolingDown ? `Wait ${cooldownSeconds}s` : "Tocar pito"}
        </Button>
      </div>

      {result ? <HornResultMessage result={result} /> : null}
    </div>
  );
}

function HornResultMessage({ result }: { result: HornResult }) {
  const isSuccess = result.status === "completed";
  const Icon = isSuccess ? CheckCircle2 : AlertTriangle;

  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border p-3 text-sm leading-6",
        isSuccess
          ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
          : "border-amber-300/25 bg-amber-400/10 text-amber-100",
      )}
      role="status"
      aria-live="polite"
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>{result.message}</p>
    </div>
  );
}

function isServiceWorkerSentryMessage(data: unknown): data is ServiceWorkerSentryMessage {
  return Boolean(
    data &&
      typeof data === "object" &&
      "type" in data &&
      data.type === "sentry_alert",
  );
}

function hasSentryAlertSearchParam() {
  return (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("sentry_alert")
  );
}

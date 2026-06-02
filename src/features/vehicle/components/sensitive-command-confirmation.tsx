"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, Timer, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COUNTDOWN_SECONDS = 5;

type SensitiveCommandConfirmationProps = {
  commandLabel: string;
  isSubmitting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function SensitiveCommandConfirmation({
  commandLabel,
  isSubmitting = false,
  onCancel,
  onConfirm,
}: SensitiveCommandConfirmationProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const hasResolvedRef = useRef(false);
  const onCancelRef = useRef(onCancel);
  const onConfirmRef = useRef(onConfirm);
  const [secondsRemaining, setSecondsRemaining] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    onCancelRef.current = onCancel;
    onConfirmRef.current = onConfirm;
  }, [onCancel, onConfirm]);

  const handleCancel = useCallback(() => {
    if (hasResolvedRef.current) {
      return;
    }

    hasResolvedRef.current = true;
    onCancelRef.current();
  }, []);

  const handleConfirm = useCallback(() => {
    if (hasResolvedRef.current) {
      return;
    }

    hasResolvedRef.current = true;
    onConfirmRef.current();
  }, []);

  useEffect(() => {
    cancelButtonRef.current?.focus();

    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1_000);
      const nextSecondsRemaining = Math.max(COUNTDOWN_SECONDS - elapsedSeconds, 0);

      setSecondsRemaining(nextSecondsRemaining);

      if (nextSecondsRemaining === 0) {
        window.clearInterval(intervalId);
        handleConfirm();
      }
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [commandLabel, handleConfirm]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCancel]);

  const countdownProgress = (secondsRemaining / COUNTDOWN_SECONDS) * 100;
  const countdownText =
    secondsRemaining > 0
      ? `${secondsRemaining} second${secondsRemaining === 1 ? "" : "s"} remaining`
      : "Executing command";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-3 pb-3 pt-10 backdrop-blur-md sm:items-center sm:p-6">
      <div
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="w-full max-w-md animate-fade-slide-in rounded-[2rem] border border-white/10 bg-zinc-950/95 p-5 text-white shadow-2xl shadow-black/60 sm:p-6"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-red-200/20 bg-red-500/10 px-3 py-1 text-xs font-medium tracking-[0.18em] text-red-100 uppercase">
              <AlertTriangle className="size-3.5" aria-hidden="true" />
              Live command
            </span>
            <div>
              <h2 id={titleId} className="text-2xl font-semibold tracking-[-0.04em] text-zinc-50">
                Execute {commandLabel}?
              </h2>
              <p id={descriptionId} className="mt-2 text-sm leading-6 text-zinc-300">
                This sends a real command to the vehicle. Make sure the area around the
                vehicle is safe before continuing.
              </p>
            </div>
          </div>
          <button
            aria-label="Cancel confirmation"
            className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-zinc-300 transition hover:bg-white/[0.08] hover:text-white focus-visible:ring-2 focus-visible:ring-red-100/70 focus-visible:outline-none"
            onClick={handleCancel}
            type="button"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-black/40 p-4">
          <div className="flex items-center justify-between gap-3 text-sm text-zinc-200">
            <span className="flex items-center gap-2 font-medium">
              <Timer className="size-4 text-red-100" aria-hidden="true" />
              Auto-execute countdown
            </span>
            <span aria-live="polite" className="text-zinc-400">
              {countdownText}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
            <div
              className="h-full rounded-full bg-red-100 transition-[width] duration-300 ease-out"
              style={{ width: `${countdownProgress}%` }}
            />
          </div>
          <p className="mt-3 text-xs leading-5 text-zinc-500">
            If you do nothing, the command executes when the countdown reaches zero.
            You can cancel or execute immediately.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            ref={cancelButtonRef}
            className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
            onClick={handleCancel}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            className={cn(
              "h-12 rounded-2xl bg-red-100 text-zinc-950 hover:bg-red-50",
              isSubmitting && "opacity-80",
            )}
            onClick={handleConfirm}
            type="button"
          >
            Execute now
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Fan,
  Lock,
  Loader2,
  Radio,
  Snowflake,
  Unlock,
  Warehouse,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SensitiveCommandConfirmation } from "@/features/vehicle/components/sensitive-command-confirmation";
import { executeVehicleCommand } from "@/features/vehicle/server/actions";
import { cn } from "@/lib/utils";

const actions = [
  { command: "wake", label: "Wake", hint: "Wake the vehicle", icon: Radio, sensitive: false, enabled: true },
  {
    command: "unlock",
    label: "Unlock",
    hint: "Requires confirmation",
    icon: Unlock,
    sensitive: true,
    enabled: true,
  },
  { command: "lock", label: "Lock", hint: "Lock the vehicle", icon: Lock, sensitive: false, enabled: true },
  {
    command: "openFrunk",
    label: "Open Frunk",
    hint: "Requires confirmation",
    icon: Warehouse,
    sensitive: true,
    enabled: true,
  },
  {
    command: "openTrunk",
    label: "Open Trunk",
    hint: "Requires confirmation",
    icon: Warehouse,
    sensitive: true,
    enabled: true,
  },
  {
    command: "startClimate",
    label: "Start Climate",
    hint: "Start cabin climate",
    icon: Snowflake,
    sensitive: false,
    enabled: true,
  },
  {
    command: "stopClimate",
    label: "Stop Climate",
    hint: "Stop cabin climate",
    icon: Snowflake,
    sensitive: false,
    enabled: true,
  },
] as const;

type EnabledCommand = (typeof actions)[number]["command"];
type ActionResult = Awaited<ReturnType<typeof executeVehicleCommand>>;

const sensitiveCommandLabels = {
  unlock: "Unlock",
  openFrunk: "Open Frunk",
  openTrunk: "Open Trunk",
} as const satisfies Partial<Record<EnabledCommand, string>>;

type SensitiveCommand = keyof typeof sensitiveCommandLabels;

function isSensitiveCommand(command: EnabledCommand): command is SensitiveCommand {
  return command in sensitiveCommandLabels;
}

export function VehicleActionGrid() {
  const router = useRouter();
  const [pendingCommand, setPendingCommand] = useState<EnabledCommand | null>(null);
  const [confirmationCommand, setConfirmationCommand] = useState<SensitiveCommand | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [isRefreshing, startRefreshTransition] = useTransition();

  function handleActionClick(command: EnabledCommand) {
    if (isSensitiveCommand(command)) {
      setConfirmationCommand(command);
      return;
    }

    void handleCommand(command);
  }

  async function handleCommand(command: EnabledCommand) {
    setPendingCommand(command);
    setResult(null);

    try {
      const commandResult = await executeVehicleCommand(command);
      setResult(commandResult);

      if (commandResult.status === "completed") {
        startRefreshTransition(() => {
          router.refresh();
        });
      }
    } catch {
      setResult({
        status: "failed",
        message: "Vehicle command was rejected. Sign in again and retry.",
      });
    } finally {
      setPendingCommand(null);
    }
  }

  return (
    <section aria-labelledby="vehicle-actions-title">
      {confirmationCommand ? (
        <SensitiveCommandConfirmation
          key={confirmationCommand}
          commandLabel={sensitiveCommandLabels[confirmationCommand]}
          isSubmitting={pendingCommand === confirmationCommand}
          onCancel={() => setConfirmationCommand(null)}
          onConfirm={() => {
            const command = confirmationCommand;
            setConfirmationCommand(null);
            void handleCommand(command);
          }}
        />
      ) : null}
      <Card className="animate-fade-slide-in border-white/10 bg-black/45 text-white shadow-xl shadow-black/40 backdrop-blur">
        <CardHeader className="px-4 sm:px-6">
          <CardDescription className="text-zinc-400">Real vehicle commands</CardDescription>
          <CardTitle id="vehicle-actions-title" className="text-2xl tracking-[-0.03em]">
            Command surface
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:grid-cols-3">
            {actions.map((action) => (
              <Button
                key={action.label}
                disabled={!action.enabled || pendingCommand !== null || isRefreshing}
                aria-busy={pendingCommand === action.command}
                onClick={() => {
                  if (action.enabled) {
                    handleActionClick(action.command);
                  }
                }}
                variant="outline"
                className={cn(
                  "group h-auto min-h-24 flex-col items-start justify-between rounded-3xl border-white/10 bg-zinc-950/70 p-4 text-left text-white shadow-black/30 transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-zinc-900/80 hover:shadow-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60",
                  action.sensitive &&
                    "border-red-300/25 bg-[linear-gradient(145deg,rgba(127,29,29,0.32),rgba(9,9,11,0.86))] hover:border-red-200/40",
                  pendingCommand === action.command && "border-red-200/40 bg-zinc-900/90",
                )}
              >
                <span className="flex w-full items-center justify-between gap-3">
                  {pendingCommand === action.command ? (
                    <Loader2 className="size-5 animate-spin text-red-100" aria-hidden="true" />
                  ) : (
                    <action.icon
                      className={cn(
                        "size-5 transition duration-200 group-hover:text-white",
                        action.sensitive ? "text-red-200" : "text-zinc-300",
                      )}
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-[0.18em] uppercase",
                      action.sensitive
                        ? "border-red-200/20 bg-red-500/10 text-red-100"
                        : "border-white/10 bg-white/[0.06] text-zinc-400",
                    )}
                  >
                    {action.enabled
                      ? pendingCommand === action.command
                        ? "Running"
                        : action.sensitive
                          ? "Confirm"
                          : "Live"
                      : "Soon"}
                  </span>
                </span>
                <span>
                  <span className="block text-base font-semibold text-zinc-50">{action.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-zinc-400">
                    {pendingCommand === action.command ? "Sending securely..." : action.hint}
                  </span>
                </span>
              </Button>
            ))}
          </div>
          {result ? <CommandResult result={result} /> : null}
          <p className="flex items-center gap-2 rounded-2xl border border-red-400/15 bg-red-500/10 p-4 text-sm leading-6 text-red-100">
            <Fan className="size-4 shrink-0" aria-hidden="true" />
            Unlock, frunk, and trunk ask for confirmation before sending live commands.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

function CommandResult({ result }: { result: ActionResult }) {
  const content = getCommandResultContent(result);
  const Icon = content.icon;

  return (
    <div
      className={cn(
        "animate-command-result-in rounded-2xl border p-4 text-sm leading-6",
        content.tone,
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex gap-3">
        <Icon
          className={cn("mt-0.5 size-4 shrink-0", result.status === "waking" && "animate-pulse")}
          aria-hidden="true"
        />
        <div className="space-y-1">
          <p className="font-semibold">{content.title}</p>
          <p>{content.message}</p>
          {result.status === "waking" ? (
            <p className="text-xs font-medium text-amber-50/90">
              Retry after: {result.retryAfterSeconds} seconds. No automatic retry was sent.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function getCommandResultContent(result: ActionResult) {
  if (result.status === "completed") {
    return {
      icon: CheckCircle2,
      message: result.message,
      title: "Command completed",
      tone: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
    };
  }

  if (result.status === "waking") {
    return {
      icon: Radio,
      message: "The vehicle is waking. Retry the command once the car is online.",
      title: "Waking vehicle...",
      tone: "border-amber-300/25 bg-amber-400/10 text-amber-100",
    };
  }

  return {
    icon: AlertTriangle,
    message: result.message,
    title: "Command failed safely",
    tone: "border-red-300/20 bg-red-500/10 text-red-100",
  };
}

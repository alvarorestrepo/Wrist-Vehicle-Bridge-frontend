"use server";

import { auth } from "@/auth";
import { z } from "zod";
import {
  getVehicleStatus,
  sendVehicleCommand,
  TeslaApiClientError,
  type TeslaApiClientErrorCode,
} from "@/features/vehicle/server";

const enabledVehicleCommandSchema = z.enum([
  "wake",
  "unlock",
  "lock",
  "openFrunk",
  "openTrunk",
  "startClimate",
  "stopClimate",
]);

type EnabledVehicleCommand = z.infer<typeof enabledVehicleCommandSchema>;

type VehicleCommandActionResult =
  | {
      status: "completed";
      message: string;
    }
  | {
      status: "waking";
      message: string;
      retryAfterSeconds: number;
    }
  | {
      status: "failed";
      message: string;
    };

const commandSuccessMessages = {
  wake: "Wake command sent successfully.",
  unlock: "Vehicle unlocked successfully.",
  lock: "Vehicle locked successfully.",
  openFrunk: "Frunk opened successfully.",
  openTrunk: "Trunk opened successfully.",
  startClimate: "Climate started successfully.",
  stopClimate: "Climate stopped successfully.",
} as const satisfies Record<EnabledVehicleCommand, string>;

export async function executeVehicleCommand(
  command: unknown,
): Promise<VehicleCommandActionResult> {
  await requireSession();

  const parsedCommand = enabledVehicleCommandSchema.safeParse(command);

  if (!parsedCommand.success) {
    return {
      status: "failed",
      message: "Vehicle command is not enabled.",
    };
  }

  const enabledCommand = parsedCommand.data;

  try {
    const result = await sendVehicleCommand(enabledCommand);

    if (result.status === "completed") {
      return {
        status: "completed",
        message: commandSuccessMessages[enabledCommand],
      };
    }

    if (result.status === "waking") {
      return {
        status: "waking",
        message: `Vehicle is waking up. Try again in about ${result.retryAfterSeconds} seconds.`,
        retryAfterSeconds: result.retryAfterSeconds,
      };
    }

    return {
      status: "failed",
      message: "Vehicle received the command but reported it failed.",
    };
  } catch (error) {
    return {
      status: "failed",
      message: getFriendlyCommandErrorMessage(error),
    };
  }
}

export async function refreshVehicleStatus() {
  await requireSession();

  return getVehicleStatus();
}

async function requireSession() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }
}

function getFriendlyCommandErrorMessage(error: unknown) {
  if (error instanceof TeslaApiClientError) {
    return commandErrorMessages[error.code] ?? commandErrorMessages.unknown;
  }

  return commandErrorMessages.unknown;
}

const commandErrorMessages: Record<TeslaApiClientErrorCode | "unknown", string> = {
  http_error: "Vehicle command is temporarily unavailable. Try again shortly.",
  invalid_response: "Vehicle command returned an unexpected response.",
  missing_tesla_scope: "Vehicle permissions are missing for this command.",
  rate_limited: "Vehicle commands are temporarily rate limited. Try again later.",
  request_failed: "Vehicle command could not reach the backend. Try again shortly.",
  timeout: "Vehicle command took too long to respond. Try again shortly.",
  unauthorized: "Vehicle command is not authorized for this session.",
  unknown: "Vehicle command failed safely. Try again shortly.",
};

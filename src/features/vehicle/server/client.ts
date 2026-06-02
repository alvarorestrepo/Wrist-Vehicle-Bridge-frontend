import "server-only";

import { ZodError, type ZodSchema } from "zod";

import { getServerEnv } from "@/lib/server/env";
import {
  knownVehicleApiErrorSchema,
  vehicleCommandResultSchema,
  vehicleStatusSchema,
  type KnownVehicleApiError,
  type VehicleBackendCommand,
  type VehicleCommandResult,
  type VehicleStatus,
} from "./schemas";

const REQUEST_TIMEOUT_MS = 10_000;

export const vehicleCommandEndpointMap = {
  wake: { endpoint: "/api/vehicle/wake", backendCommand: "wake" },
  lock: { endpoint: "/api/vehicle/lock", backendCommand: "lock" },
  unlock: { endpoint: "/api/vehicle/unlock", backendCommand: "unlock" },
  openFrunk: {
    endpoint: "/api/vehicle/frunk/open",
    backendCommand: "frunk_open",
  },
  openTrunk: {
    endpoint: "/api/vehicle/trunk/open",
    backendCommand: "trunk_open",
  },
  startClimate: {
    endpoint: "/api/vehicle/climate/start",
    backendCommand: "climate_start",
  },
  stopClimate: {
    endpoint: "/api/vehicle/climate/stop",
    backendCommand: "climate_stop",
  },
} as const satisfies Record<
  string,
  { endpoint: `/api/vehicle/${string}`; backendCommand: VehicleBackendCommand }
>;

export type VehicleCommandName = keyof typeof vehicleCommandEndpointMap;

export type TeslaApiClientErrorCode =
  | KnownVehicleApiError["error"]
  | "http_error"
  | "invalid_response"
  | "request_failed"
  | "timeout";

export class TeslaApiClientError extends Error {
  readonly code: TeslaApiClientErrorCode;
  readonly status?: number;
  readonly cause?: unknown;

  constructor({
    code,
    message,
    status,
    cause,
  }: {
    code: TeslaApiClientErrorCode;
    message: string;
    status?: number;
    cause?: unknown;
  }) {
    super(message);
    this.name = "TeslaApiClientError";
    this.code = code;
    this.status = status;
    this.cause = cause;
  }
}

export async function getVehicleStatus() {
  return requestTeslaBackend("/api/vehicle/status", vehicleStatusSchema, {
    method: "GET",
  });
}

export async function sendVehicleCommand(
  command: VehicleCommandName,
): Promise<VehicleCommandResult> {
  return requestTeslaBackend(
    vehicleCommandEndpointMap[command].endpoint,
    vehicleCommandResultSchema,
    { method: "POST" },
  );
}

async function requestTeslaBackend<TResponse>(
  endpoint: `/api/vehicle/${string}`,
  responseSchema: ZodSchema<TResponse>,
  init: Pick<RequestInit, "method">,
): Promise<TResponse> {
  const { TESLA_BACKEND_URL, TESLA_CLIENT_API_TOKEN } = getServerEnv();
  const url = new URL(endpoint, TESLA_BACKEND_URL);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${TESLA_CLIENT_API_TOKEN}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    throw normalizeFetchError(error);
  } finally {
    clearTimeout(timeoutId);
  }

  const payload = await parseJsonResponse(response);
  const knownError = knownVehicleApiErrorSchema.safeParse(payload);

  if (knownError.success) {
    throw new TeslaApiClientError({
      code: knownError.data.error,
      message: `Tesla backend returned ${knownError.data.error}.`,
      status: response.status,
    });
  }

  if (!response.ok) {
    throw new TeslaApiClientError({
      code: "http_error",
      message: `Tesla backend request failed with status ${response.status}.`,
      status: response.status,
    });
  }

  try {
    return responseSchema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new TeslaApiClientError({
        code: "invalid_response",
        message: "Tesla backend returned an unexpected response shape.",
        status: response.status,
        cause: error,
      });
    }

    throw error;
  }
}

async function parseJsonResponse(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch (error) {
    throw new TeslaApiClientError({
      code: "invalid_response",
      message: "Tesla backend returned a non-JSON response.",
      status: response.status,
      cause: error,
    });
  }
}

function normalizeFetchError(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return new TeslaApiClientError({
      code: "timeout",
      message: "Tesla backend request timed out.",
      cause: error,
    });
  }

  return new TeslaApiClientError({
    code: "request_failed",
    message: "Tesla backend request failed before receiving a response.",
    cause: error,
  });
}

export type { VehicleCommandResult, VehicleStatus };

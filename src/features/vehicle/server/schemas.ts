import { z } from "zod";

export const vehicleStatusSuccessSchema = z
  .object({
    batteryPercent: z.number().int().min(0).max(100),
    locked: z.boolean(),
    climateOn: z.boolean(),
    vehicleOnline: z.literal(true),
    lastUpdatedAt: z.string().min(1),
  })
  .strict();

export const vehicleStatusUnavailableSchema = z
  .object({
    error: z.literal("vehicle_unavailable"),
    vehicleOnline: z.literal(false),
    lastUpdatedAt: z.string().min(1),
  })
  .strict();

export const vehicleStatusSchema = z.union([
  vehicleStatusSuccessSchema,
  vehicleStatusUnavailableSchema,
]);

export const vehicleBackendCommandSchema = z.enum([
  "wake",
  "lock",
  "unlock",
  "frunk_open",
  "trunk_open",
  "climate_start",
  "climate_stop",
]);

export const commandCompletedSchema = z
  .object({
    command: vehicleBackendCommandSchema,
    status: z.literal("completed"),
    vehicleOnline: z.literal(true),
    lastUpdatedAt: z.string().min(1),
  })
  .strict();

export const commandWakingSchema = z
  .object({
    command: vehicleBackendCommandSchema,
    status: z.literal("waking"),
    vehicleOnline: z.literal(false),
    retryAfterSeconds: z.number().int().positive(),
    nextAction: z.literal("poll_status_then_retry_command"),
    statusUrl: z.literal("/api/vehicle/status"),
    retryCommandUrl: z.string().startsWith("/api/vehicle/"),
    lastUpdatedAt: z.string().min(1),
  })
  .strict();

export const commandFailedSchema = z
  .object({
    command: vehicleBackendCommandSchema,
    status: z.literal("failed"),
    error: z.literal("vehicle_command_failed"),
    vehicleOnline: z.literal(true),
    lastUpdatedAt: z.string().min(1),
  })
  .strict();

export const vehicleCommandResultSchema = z.union([
  commandCompletedSchema,
  commandWakingSchema,
  commandFailedSchema,
]);

export const knownVehicleApiErrorSchema = z
  .object({
    error: z.enum(["unauthorized", "rate_limited", "missing_tesla_scope"]),
  })
  .strict();

export type VehicleStatus = z.infer<typeof vehicleStatusSchema>;
export type VehicleCommandResult = z.infer<typeof vehicleCommandResultSchema>;
export type VehicleBackendCommand = z.infer<typeof vehicleBackendCommandSchema>;
export type KnownVehicleApiError = z.infer<typeof knownVehicleApiErrorSchema>;

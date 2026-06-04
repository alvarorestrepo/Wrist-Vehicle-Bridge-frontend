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

export const sentryModeSchema = z.enum([
  "unknown",
  "off",
  "idle",
  "armed",
  "aware",
  "panic",
  "quiet",
]);

export const vehicleSentryAvailabilityReasonSchema = z.enum([
  "vehicle_unavailable",
  "missing_data",
]);

export const vehicleSentryStatusAvailableSchema = z
  .object({
    sentryMode: sentryModeSchema,
    isActive: z.boolean(),
    isIncidentLikely: z.boolean(),
    lastUpdatedAt: z.string().min(1).nullable(),
    source: z.string().min(1),
    vehicleOnline: z.boolean(),
    availabilityReason: z.literal("missing_data").optional(),
  })
  .strict();

export const vehicleSentryStatusUnavailableSchema = z
  .object({
    sentryMode: z.literal("unknown"),
    isActive: z.literal(false),
    isIncidentLikely: z.literal(false),
    lastUpdatedAt: z.null(),
    source: z.literal("unavailable"),
    vehicleOnline: z.literal(false),
    availabilityReason: z.literal("vehicle_unavailable"),
  })
  .strict();

export const vehicleSentryStatusSchema = z.union([
  vehicleSentryStatusUnavailableSchema,
  vehicleSentryStatusAvailableSchema,
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
    error: z.enum([
      "unauthorized",
      "rate_limited",
      "missing_tesla_scope",
      "vehicle_unavailable",
      "vehicle_command_not_configured",
      "horn_command_failed",
    ]),
    retryAfterSeconds: z.number().int().positive().optional(),
  })
  .strict();

export const hornSuccessSchema = z
  .object({
    result: z.literal("honk_requested"),
    requestedAt: z.string().min(1),
  })
  .strict();

export const hornCooldownErrorSchema = z
  .object({
    error: z.literal("horn_cooldown_active"),
    retryAfterSeconds: z.number().int().positive(),
  })
  .strict();

export type VehicleStatus = z.infer<typeof vehicleStatusSchema>;
export type VehicleSentryStatus = z.infer<typeof vehicleSentryStatusSchema>;
export type VehicleCommandResult = z.infer<typeof vehicleCommandResultSchema>;
export type VehicleBackendCommand = z.infer<typeof vehicleBackendCommandSchema>;
export type KnownVehicleApiError = z.infer<typeof knownVehicleApiErrorSchema>;
export type HornSuccess = z.infer<typeof hornSuccessSchema>;

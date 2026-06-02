import { z } from "zod";

export const vapidPublicKeyResponseSchema = z
  .object({
    publicKey: z.string().min(1),
  })
  .strict();

export const pushNotConfiguredResponseSchema = z
  .object({
    error: z.literal("push_not_configured"),
  })
  .strict();

export const pushSubscriptionSchema = z
  .object({
    endpoint: z.url(),
    expirationTime: z.number().nullable().optional(),
    keys: z
      .object({
        auth: z.string().min(1),
        p256dh: z.string().min(1),
      })
      .strict(),
  })
  .strict();

export const pushSubscribeResponseSchema = z
  .object({
    id: z.string().min(1),
    email: z.email(),
    endpoint: z.url(),
    deviceLabel: z.string().min(1).nullable().optional(),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
  })
  .strict();

export const invalidPushSubscriptionResponseSchema = z
  .object({
    error: z.literal("invalid_push_subscription"),
  })
  .strict();

export type PushSubscriptionPayload = z.infer<typeof pushSubscriptionSchema>;
export type PushSubscribeResponse = z.infer<typeof pushSubscribeResponseSchema>;

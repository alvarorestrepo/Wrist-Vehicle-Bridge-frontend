"use server";

import { auth } from "@/auth";
import {
  deletePushSubscription,
  getVapidPublicKey,
  PushApiClientError,
  subscribeToPushNotifications,
} from "@/features/push/server";
import { pushSubscriptionSchema } from "@/features/push/server/schemas";
import { z } from "zod";

const deviceLabelSchema = z.string().trim().min(1).max(80);

type VapidPublicKeyActionResult =
  | { status: "configured"; publicKey: string }
  | { status: "not_configured" }
  | { status: "failed"; message: string };

type PushSubscriptionActionResult =
  | { status: "completed"; message: string }
  | { status: "not_configured"; message: string }
  | { status: "failed"; message: string };

export async function getPushVapidPublicKey(): Promise<VapidPublicKeyActionResult> {
  await requireSessionEmail();

  try {
    const response = await getVapidPublicKey();

    return { status: "configured", publicKey: response.publicKey };
  } catch (error) {
    if (error instanceof PushApiClientError && error.code === "push_not_configured") {
      return { status: "not_configured" };
    }

    return {
      status: "failed",
      message: getFriendlyPushErrorMessage(error),
    };
  }
}

export async function registerPushSubscription(
  subscription: unknown,
  deviceLabel: unknown,
): Promise<PushSubscriptionActionResult> {
  const email = await requireSessionEmail();
  const parsedSubscription = pushSubscriptionSchema.safeParse(subscription);
  const parsedDeviceLabel = deviceLabelSchema.safeParse(deviceLabel);

  if (!parsedSubscription.success || !parsedDeviceLabel.success) {
    return {
      status: "failed",
      message: "Push subscription could not be registered on this browser.",
    };
  }

  try {
    await subscribeToPushNotifications({
      email,
      subscription: parsedSubscription.data,
      deviceLabel: parsedDeviceLabel.data,
    });

    return {
      status: "completed",
      message: "Push notifications are enabled for this device.",
    };
  } catch (error) {
    if (error instanceof PushApiClientError && error.code === "push_not_configured") {
      return {
        status: "not_configured",
        message: "Push notifications are not configured on the backend yet.",
      };
    }

    return {
      status: "failed",
      message: getFriendlyPushErrorMessage(error),
    };
  }
}

export async function unregisterPushSubscription(
  subscription: unknown,
): Promise<PushSubscriptionActionResult> {
  const email = await requireSessionEmail();
  const parsedSubscription = pushSubscriptionSchema.safeParse(subscription);

  if (!parsedSubscription.success) {
    return {
      status: "failed",
      message: "Push subscription could not be disabled for this browser.",
    };
  }

  try {
    await deletePushSubscription({ email, endpoint: parsedSubscription.data.endpoint });

    return {
      status: "completed",
      message: "Push notifications are disabled for this device.",
    };
  } catch (error) {
    if (error instanceof PushApiClientError && error.code === "push_not_configured") {
      return {
        status: "not_configured",
        message: "Push notifications are not configured on the backend yet.",
      };
    }

    return {
      status: "failed",
      message: getFriendlyPushErrorMessage(error),
    };
  }
}

async function requireSessionEmail() {
  const session = await auth();
  const email = session?.user?.email;

  if (!session?.user || !email) {
    throw new Error("Unauthorized");
  }

  return email;
}

function getFriendlyPushErrorMessage(error: unknown) {
  if (error instanceof PushApiClientError) {
    return pushErrorMessages[error.code] ?? pushErrorMessages.unknown;
  }

  return pushErrorMessages.unknown;
}

const pushErrorMessages = {
  http_error: "Push notifications are temporarily unavailable. Try again shortly.",
  invalid_push_subscription: "This browser returned an invalid push subscription.",
  invalid_response: "Push notifications returned an unexpected backend response.",
  push_not_configured: "Push notifications are not configured on the backend yet.",
  request_failed: "Push notifications could not reach the backend. Try again shortly.",
  timeout: "Push notifications took too long to respond. Try again shortly.",
  unknown: "Push notifications failed safely. Try again shortly.",
} as const;

import "server-only";

import { ZodError, type ZodSchema } from "zod";

import { getServerEnv } from "@/lib/server/env";
import {
  invalidPushSubscriptionResponseSchema,
  pushNotConfiguredResponseSchema,
  pushSubscribeResponseSchema,
  vapidPublicKeyResponseSchema,
  type PushSubscribeResponse,
  type PushSubscriptionPayload,
} from "./schemas";

const REQUEST_TIMEOUT_MS = 10_000;

export type PushApiClientErrorCode =
  | "http_error"
  | "invalid_push_subscription"
  | "invalid_response"
  | "push_not_configured"
  | "request_failed"
  | "timeout";

export class PushApiClientError extends Error {
  readonly code: PushApiClientErrorCode;
  readonly status?: number;
  readonly cause?: unknown;

  constructor({
    code,
    message,
    status,
    cause,
  }: {
    code: PushApiClientErrorCode;
    message: string;
    status?: number;
    cause?: unknown;
  }) {
    super(message);
    this.name = "PushApiClientError";
    this.code = code;
    this.status = status;
    this.cause = cause;
  }
}

export async function getVapidPublicKey() {
  return requestPushBackend("/api/push/vapid-public-key", vapidPublicKeyResponseSchema, {
    method: "GET",
  });
}

export async function subscribeToPushNotifications({
  deviceLabel,
  email,
  subscription,
}: {
  deviceLabel: string;
  email: string;
  subscription: PushSubscriptionPayload;
}): Promise<PushSubscribeResponse> {
  return requestPushBackend("/api/push/subscribe", pushSubscribeResponseSchema, {
    body: JSON.stringify({ email, subscription, deviceLabel }),
    method: "POST",
  });
}

export async function deletePushSubscription({
  email,
  endpoint,
}: {
  email: string;
  endpoint: string;
}) {
  await requestPushBackendWithoutBody("/api/push/subscribe", {
    body: JSON.stringify({ email, endpoint }),
    method: "DELETE",
  });
}

async function requestPushBackend<TResponse>(
  endpoint: `/api/push/${string}`,
  responseSchema: ZodSchema<TResponse>,
  init: Pick<RequestInit, "body" | "method">,
): Promise<TResponse> {
  const response = await sendPushBackendRequest(endpoint, init);
  const payload = await parseJsonResponse(response);

  assertNoKnownPushError(payload, response.status);

  if (!response.ok) {
    throw new PushApiClientError({
      code: "http_error",
      message: `Push backend request failed with status ${response.status}.`,
      status: response.status,
    });
  }

  try {
    return responseSchema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new PushApiClientError({
        code: "invalid_response",
        message: "Push backend returned an unexpected response shape.",
        status: response.status,
        cause: error,
      });
    }

    throw error;
  }
}

async function requestPushBackendWithoutBody(
  endpoint: `/api/push/${string}`,
  init: Pick<RequestInit, "body" | "method">,
) {
  const response = await sendPushBackendRequest(endpoint, init);

  if (response.status === 204) {
    return;
  }

  const payload = await parseJsonResponse(response);

  assertNoKnownPushError(payload, response.status);

  throw new PushApiClientError({
    code: "http_error",
    message: `Push backend request failed with status ${response.status}.`,
    status: response.status,
  });
}

async function sendPushBackendRequest(
  endpoint: `/api/push/${string}`,
  init: Pick<RequestInit, "body" | "method">,
) {
  const { TESLA_BACKEND_URL, TESLA_CLIENT_API_TOKEN } = getServerEnv();
  const url = new URL(endpoint, TESLA_BACKEND_URL);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${TESLA_CLIENT_API_TOKEN}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    throw normalizeFetchError(error);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function parseJsonResponse(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch (error) {
    throw new PushApiClientError({
      code: "invalid_response",
      message: "Push backend returned a non-JSON response.",
      status: response.status,
      cause: error,
    });
  }
}

function assertNoKnownPushError(payload: unknown, status: number) {
  const notConfigured = pushNotConfiguredResponseSchema.safeParse(payload);

  if (notConfigured.success) {
    throw new PushApiClientError({
      code: "push_not_configured",
      message: "Push notifications are not configured on the backend.",
      status,
    });
  }

  const invalidSubscription = invalidPushSubscriptionResponseSchema.safeParse(payload);

  if (invalidSubscription.success) {
    throw new PushApiClientError({
      code: "invalid_push_subscription",
      message: "Push backend rejected the subscription payload.",
      status,
    });
  }
}

function normalizeFetchError(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return new PushApiClientError({
      code: "timeout",
      message: "Push backend request timed out.",
      cause: error,
    });
  }

  return new PushApiClientError({
    code: "request_failed",
    message: "Push backend request failed before receiving a response.",
    cause: error,
  });
}

export type { PushSubscribeResponse, PushSubscriptionPayload };

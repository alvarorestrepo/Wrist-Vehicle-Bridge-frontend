"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, BellOff, Loader2, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getPushVapidPublicKey,
  registerPushSubscription,
  unregisterPushSubscription,
} from "@/features/push/server/actions";
import { cn } from "@/lib/utils";

type PermissionState = NotificationPermission | "unsupported";
type SubscriptionState = "checking" | "subscribed" | "unsubscribed";
type BackendState = "available" | "not_configured";

type PushMessage = {
  tone: "error" | "info" | "success";
  text: string;
};

export function PushNotificationsCard() {
  const [permission, setPermission] = useState<PermissionState>("default");
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>("checking");
  const [backendState, setBackendState] = useState<BackendState>("available");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<PushMessage | null>(null);

  const isSupported = permission !== "unsupported";
  const isSubscribed = subscriptionState === "subscribed";
  const statusContent = useMemo(
    () => getStatusContent({ backendState, isSupported, permission, subscriptionState }),
    [backendState, isSupported, permission, subscriptionState],
  );

  useEffect(() => {
    let isActive = true;

    async function checkPushState() {
      if (!isPushSupported()) {
        if (isActive) {
          setPermission("unsupported");
          setSubscriptionState("unsubscribed");
        }

        return;
      }

      try {
        const subscription = await getExistingSubscription();

        if (isActive) {
          setPermission(Notification.permission);
          setSubscriptionState(subscription ? "subscribed" : "unsubscribed");
        }
      } catch {
        if (isActive) {
          setPermission(Notification.permission);
          setSubscriptionState("unsubscribed");
        }
      }
    }

    void checkPushState();

    return () => {
      isActive = false;
    };
  }, []);

  async function handleEnable() {
    if (!isPushSupported()) {
      setPermission("unsupported");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const nextPermission =
        Notification.permission === "default"
          ? await Notification.requestPermission()
          : Notification.permission;

      setPermission(nextPermission);

      if (nextPermission === "denied") {
        setMessage({
          tone: "error",
          text: "Browser permission is denied. Enable notifications in browser settings first.",
        });
        return;
      }

      if (nextPermission !== "granted") {
        setMessage({ tone: "info", text: "Notification permission was not granted yet." });
        return;
      }

      const vapidResult = await getPushVapidPublicKey();

      if (vapidResult.status === "not_configured") {
        setBackendState("not_configured");
        setMessage({
          tone: "info",
          text: "Push notifications are not configured on the backend yet.",
        });
        return;
      }

      if (vapidResult.status === "failed") {
        setMessage({ tone: "error", text: vapidResult.message });
        return;
      }

      const registration = await ensureServiceWorkerRegistration();
      const existingSubscription = await registration.pushManager.getSubscription();
      const didCreateSubscription = !existingSubscription;
      const subscription =
        existingSubscription ??
        (await registration.pushManager.subscribe({
          applicationServerKey: urlBase64ToUint8Array(vapidResult.publicKey),
          userVisibleOnly: true,
        }));
      const serializedSubscription = serializePushSubscription(subscription);
      const result = await registerPushSubscription(serializedSubscription, getDeviceLabel());

      if (result.status === "completed") {
        setBackendState("available");
        setSubscriptionState("subscribed");
        setMessage({ tone: "success", text: result.message });
        return;
      }

      if (didCreateSubscription) {
        await subscription.unsubscribe();
      }

      if (result.status === "not_configured") {
        setBackendState("not_configured");
        setMessage({ tone: "info", text: result.message });
        return;
      }

      setMessage({ tone: "error", text: result.message });
    } catch {
      setMessage({
        tone: "error",
        text: "Push notifications could not be enabled for this browser.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDisable() {
    if (!isPushSupported()) {
      setPermission("unsupported");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const subscription = await getExistingSubscription();

      if (!subscription) {
        setSubscriptionState("unsubscribed");
        setMessage({ tone: "info", text: "This browser is not currently subscribed." });
        return;
      }

      const result = await unregisterPushSubscription(serializePushSubscription(subscription));

      if (result.status === "completed" || result.status === "not_configured") {
        await subscription.unsubscribe();
        setSubscriptionState("unsubscribed");
        setBackendState(result.status === "not_configured" ? "not_configured" : "available");
        setMessage({ tone: result.status === "completed" ? "success" : "info", text: result.message });
        return;
      }

      setMessage({ tone: "error", text: result.message });
    } catch {
      setMessage({
        tone: "error",
        text: "Push notifications could not be disabled for this browser.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="push-notifications-title" className="mt-5 sm:mt-8">
      <Card className="animate-fade-slide-in border-white/10 bg-zinc-950/70 text-white shadow-xl shadow-black/40 backdrop-blur">
        <CardHeader className="px-4 sm:px-6">
          <CardDescription className="text-zinc-400">Browser push alerts</CardDescription>
          <div className="flex items-start justify-between gap-4">
            <CardTitle id="push-notifications-title" className="text-2xl tracking-[-0.03em]">
              Push notifications
            </CardTitle>
            <span className={cn("rounded-full border px-2 py-1 text-[10px] font-semibold tracking-[0.18em] uppercase", statusContent.badgeTone)}>
              {statusContent.badge}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          <div className={cn("rounded-3xl border p-4 sm:p-5", statusContent.panelTone)}>
            <div className="flex gap-3">
              <statusContent.icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <div className="space-y-1">
                <p className="font-semibold">{statusContent.title}</p>
                <p className="text-sm leading-6">{statusContent.description}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              disabled={!isSupported || permission === "denied" || isSubscribed || isSubmitting}
              onClick={() => void handleEnable()}
              className="rounded-full bg-red-500 text-white hover:bg-red-400"
            >
              {isSubmitting && !isSubscribed ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Bell aria-hidden="true" />}
              Enable
            </Button>
            <Button
              disabled={!isSupported || !isSubscribed || isSubmitting}
              onClick={() => void handleDisable()}
              variant="outline"
              className="rounded-full border-white/10 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white"
            >
              {isSubmitting && isSubscribed ? <Loader2 className="animate-spin" aria-hidden="true" /> : <BellOff aria-hidden="true" />}
              Disable
            </Button>
          </div>

          {message ? (
            <p
              className={cn(
                "rounded-2xl border p-4 text-sm leading-6",
                message.tone === "success" && "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
                message.tone === "info" && "border-amber-300/25 bg-amber-400/10 text-amber-100",
                message.tone === "error" && "border-red-300/20 bg-red-500/10 text-red-100",
              )}
              role="status"
              aria-live="polite"
            >
              {message.text}
            </p>
          ) : null}

          <p className="text-xs leading-5 text-zinc-500">
            Device label is derived locally from browser and platform details; account identity is always read
            from the authenticated session on the server.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

async function ensureServiceWorkerRegistration() {
  const existingRegistration = await navigator.serviceWorker.getRegistration("/");

  if (existingRegistration) {
    return existingRegistration;
  }

  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

async function getExistingSubscription() {
  const registration = await ensureServiceWorkerRegistration();

  return registration.pushManager.getSubscription();
}

function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function serializePushSubscription(subscription: PushSubscription) {
  return JSON.parse(JSON.stringify(subscription)) as unknown;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

function getDeviceLabel() {
  const platform = navigator.platform || "unknown platform";
  const browser = navigator.userAgent.split(" ").at(-1) ?? "browser";

  return `Tesla Web ${browser} on ${platform}`.slice(0, 80);
}

function getStatusContent({
  backendState,
  isSupported,
  permission,
  subscriptionState,
}: {
  backendState: BackendState;
  isSupported: boolean;
  permission: PermissionState;
  subscriptionState: SubscriptionState;
}) {
  if (!isSupported) {
    return {
      badge: "Unsupported",
      badgeTone: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
      description: "This browser or context does not support secure Web Push notifications.",
      icon: ShieldAlert,
      panelTone: "border-zinc-500/20 bg-zinc-500/10 text-zinc-200",
      title: "Push is not supported",
    };
  }

  if (backendState === "not_configured") {
    return {
      badge: "Backend setup needed",
      badgeTone: "border-amber-300/25 bg-amber-400/10 text-amber-100",
      description: "The backend has not been configured with Web Push credentials yet.",
      icon: ShieldAlert,
      panelTone: "border-amber-300/25 bg-amber-400/10 text-amber-100",
      title: "Push backend is not configured",
    };
  }

  if (permission === "denied") {
    return {
      badge: "Denied",
      badgeTone: "border-red-300/25 bg-red-500/10 text-red-100",
      description: "Browser permission is denied. Change the site notification setting to enable alerts.",
      icon: BellOff,
      panelTone: "border-red-300/20 bg-red-500/10 text-red-100",
      title: "Notifications blocked",
    };
  }

  if (subscriptionState === "checking") {
    return {
      badge: "Checking",
      badgeTone: "border-white/10 bg-white/[0.06] text-zinc-300",
      description: "Checking this browser's push subscription status.",
      icon: Loader2,
      panelTone: "border-white/10 bg-white/[0.04] text-zinc-200",
      title: "Checking subscription",
    };
  }

  if (subscriptionState === "subscribed") {
    return {
      badge: "Enabled",
      badgeTone: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
      description: "This browser is subscribed and can receive vehicle bridge alerts.",
      icon: Bell,
      panelTone: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
      title: "Push notifications enabled",
    };
  }

  return {
    badge: permission === "default" ? "Permission needed" : "Disabled",
    badgeTone: "border-white/10 bg-white/[0.06] text-zinc-300",
    description:
      permission === "default"
        ? "Enable push notifications to allow this browser to receive alerts."
        : "This browser is not subscribed to push notifications.",
    icon: BellOff,
    panelTone: "border-white/10 bg-white/[0.04] text-zinc-200",
    title: permission === "default" ? "Permission not requested" : "Push notifications disabled",
  };
}

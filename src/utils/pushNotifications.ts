/**
 * ForageFlow — Push Notification Infrastructure
 *
 * Service worker push registration, permission requests, and notification wiring.
 *
 * Requirements: 21.1–21.8
 */

import { putRecord, getRecord } from "@/offline/db";

/**
 * Checks if push notifications are supported in the current browser.
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Requests push notification permission from the user.
 * Should be called at appropriate moments (after beacon activation or event bookmark).
 *
 * @returns The permission state: 'granted', 'denied', or 'default'
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return "denied";

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Registers the service worker for push notifications and stores the subscription.
 *
 * @param userId - The current user's ID
 * @returns The push subscription or null if registration failed
 */
export async function registerPushSubscription(
  userId: string,
): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      // In production, the VAPID public key would come from the server
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          // Placeholder VAPID key — replace with actual key in production
          "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkOs-N0y-qdHB_A-CkVMHIxJjEhqWRWHzI6EHWiGJg",
        ) as unknown as BufferSource,
      });
    }

    // Store subscription in IndexedDB
    if (subscription) {
      const keys = subscription.toJSON().keys ?? {};
      await putRecord("pushSubscriptions", {
        id: `push-${userId}`,
        userId,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: keys.p256dh ?? "",
          auth: keys.auth ?? "",
        },
        createdAt: new Date().toISOString(),
      } as never);
    }

    return subscription;
  } catch {
    return null;
  }
}

/**
 * Sends a local notification (for testing or when push server is unavailable).
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  options?: NotificationOptions,
): Promise<void> {
  if (!isPushSupported()) return;
  if (Notification.permission !== "granted") return;

  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification(title, {
    body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    ...options,
  });
}

/**
 * Sends a beacon safety alert notification.
 */
export async function sendBeaconAlert(
  userName: string,
  lastKnownLocation?: { lat: number; lng: number },
): Promise<void> {
  const body = lastKnownLocation
    ? `${userName} has been inactive. Last known location: ${lastKnownLocation.lat.toFixed(4)}, ${lastKnownLocation.lng.toFixed(4)}`
    : `${userName} has been inactive beyond their set duration.`;

  await sendLocalNotification("Safety Alert", body, {
    tag: "beacon-alert",
    requireInteraction: true,
  });
}

/**
 * Sends an event reminder notification.
 */
export async function sendEventReminder(
  eventTitle: string,
  eventDate: string,
): Promise<void> {
  await sendLocalNotification("Event Reminder", `${eventTitle} is coming up on ${eventDate}`, {
    tag: `event-${eventTitle}`,
  });
}

/**
 * Sends a new blog article notification.
 */
export async function sendBlogNotification(articleTitle: string): Promise<void> {
  // Check if blog notifications are enabled
  const settings = await getRecord("settings", "app-settings");
  if (settings && typeof settings === "object" && "blogNotificationsEnabled" in settings) {
    if (!(settings as { blogNotificationsEnabled?: boolean }).blogNotificationsEnabled) {
      return; // User has disabled blog notifications
    }
  }

  await sendLocalNotification("New Article", articleTitle, {
    tag: "blog-new",
  });
}

/**
 * Converts a URL-safe base64 string to a Uint8Array (for VAPID key).
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

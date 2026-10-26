/**
 * BROWSER PUSH & SYSTEM TRAY NOTIFICATION UTILITIES
 * ----------------------------------------------------------------------------
 * Lightweight native HTML5 Web Notifications API.
 * Dispatches native operating system & browser push notifications (Windows notification tray,
 * macOS notification center, Android notification shade) without heavy external SaaS dependencies.
 */

export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return "denied";
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return "denied";
  }
}

export function getPushPermissionStatus(): NotificationPermission {
  if (!isPushSupported()) return "denied";
  return Notification.permission;
}

export function sendBrowserPushNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    badge?: string;
    data?: any;
    onClick?: () => void;
  }
) {
  if (!isPushSupported() || Notification.permission !== "granted") {
    return null;
  }

  try {
    const notif = new Notification(title, {
      body: options?.body || "",
      icon: options?.icon || "/favicon.ico",
      badge: options?.badge || "/favicon.ico",
      data: options?.data,
    });

    if (options?.onClick) {
      notif.onclick = () => {
        window.focus();
        options.onClick?.();
        notif.close();
      };
    }

    return notif;
  } catch (err) {
    console.warn("Failed to display browser push notification:", err);
    return null;
  }
}

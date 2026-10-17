// =====================================================================
// KUNDA SPACE: PWA, BADGING & SYSTEM TRAY NOTIFICATION UTILITY
// =====================================================================

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Registers the service worker for PWA functionality & background notifications
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    swRegistration = reg;

    // Check for updates periodically
    reg.addEventListener('updatefound', () => {
      const installingWorker = reg.installing;
      if (installingWorker) {
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('✨ Kunda Space update available.');
          }
        };
      }
    });

    return reg;
  } catch (err) {
    console.warn('⚠️ Service Worker registration error:', err);
    return null;
  }
}

/**
 * Sets the numeric badge on the Kunda app icon (Phone home screen & PC taskbar/dock)
 */
export async function setAppBadge(count: number): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // 1. Standard Web App Badging API
    if ('setAppBadge' in navigator) {
      if (count > 0) {
        await (navigator as any).setAppBadge(count);
      } else {
        await (navigator as any).clearAppBadge();
      }
    }

    // 2. Also notify the Service Worker to mirror the badge
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: count > 0 ? 'SET_BADGE' : 'CLEAR_BADGE',
        count,
      });
    }

    // 3. Fallback: Update document title with badge counter
    const currentTitle = document.title.replace(/^\(\d+\)\s*/, '');
    if (count > 0) {
      document.title = `(${count}) ${currentTitle}`;
    } else {
      document.title = currentTitle;
    }
  } catch (err) {
    // Graceful fallback if device/browser doesn't support Badging API
  }
}

/**
 * Clears the numeric badge on the Kunda app icon
 */
export async function clearAppBadge(): Promise<void> {
  await setAppBadge(0);
}

/**
 * Displays a push notification that pops up in the phone notification tray or PC Action Center
 */
export async function showSystemNotification(
  title: string,
  options: {
    body: string;
    icon?: string;
    badge?: string;
    url?: string;
    tag?: string;
  }
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return false;
  }

  const notifOptions: any = {
    body: options.body,
    icon: options.icon || '/logo.svg',
    badge: options.badge || '/logo.svg',
    tag: options.tag || 'kunda-msg-' + Date.now(),
    data: { url: options.url || '/dashboard/messages' },
    renotify: true,
    ...( 'vibrate' in Notification.prototype ? { vibrate: [200, 100, 200] } : {} ),
  };

  try {
    // Prefer Service Worker showNotification if active (ensures phone tray rendering on Android & PC)
    if (swRegistration && 'showNotification' in swRegistration) {
      await swRegistration.showNotification(title, notifOptions);
      return true;
    }

    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, notifOptions);
      return true;
    }

    // Fallback to direct window Notification
    const notif = new Notification(title, notifOptions);
    notif.onclick = () => {
      window.focus();
      if (options.url) {
        window.location.href = options.url;
      }
      notif.close();
    };
    return true;
  } catch (err) {
    console.warn('⚠️ Could not show system notification:', err);
    return false;
  }
}

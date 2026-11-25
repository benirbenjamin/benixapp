/**
 * Lightweight in-app toast notifications (no external dependencies).
 * Replaces window.alert for non-blocking, polished user feedback.
 */

export type ToastType = 'success' | 'error' | 'info';

let activeToast: HTMLDivElement | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

export function showToast(message: string, type: ToastType = 'info'): void {
  if (typeof document === 'undefined') return;

  // Remove any existing toast to avoid stacking
  if (activeToast) {
    activeToast.remove();
    activeToast = null;
  }
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }

  const colors: Record<ToastType, string> = {
    success: '#059669',
    error: '#e11d48',
    info: '#2563eb'
  };

  const toast = document.createElement('div');
  toast.textContent = message;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.style.cssText = [
    'position: fixed',
    'bottom: 24px',
    'left: 50%',
    'transform: translateX(-50%) translateY(0)',
    'z-index: 99999',
    'padding: 12px 20px',
    'border-radius: 12px',
    'font-size: 13px',
    'font-weight: 600',
    'color: #ffffff',
    `background: ${colors[type] || colors.info}`,
    'box-shadow: 0 10px 30px rgba(0,0,0,0.45)',
    'max-width: calc(100vw - 48px)',
    'text-align: center',
    'line-height: 1.4',
    'opacity: 0',
    'transition: opacity 0.2s ease, transform 0.2s ease'
  ].join(';');

  document.body.appendChild(toast);
  activeToast = toast;

  // Trigger entrance animation
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(-4px)';
  });

  hideTimer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    setTimeout(() => {
      toast.remove();
      if (activeToast === toast) activeToast = null;
    }, 200);
  }, 3000);
}

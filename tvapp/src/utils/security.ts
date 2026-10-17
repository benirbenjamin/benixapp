/**
 * Security Guard
 * - F12 key is explicitly ALLOWED for debugging.
 * - Other shortcuts (Ctrl+U view source, Ctrl+S save page, right click) are blocked.
 */

export const initSecurityGuard = () => {
  if (typeof window === 'undefined') return;

  // 1. Prevent Right-Click Context Menu
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });

  // 2. Keyboard shortcut guard
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    // F12 IS ALLOWED (Do NOT block F12)
    if (e.key === 'F12' || e.keyCode === 123) {
      return true;
    }

    // Block Ctrl+U / Cmd+U (View Source)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) {
      e.preventDefault();
      return false;
    }

    // Block Ctrl+S / Cmd+S (Save Page)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'S' || e.key === 's' || e.keyCode === 83)) {
      e.preventDefault();
      return false;
    }

    // Block Ctrl+Shift+C (Inspect Element selector)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.keyCode === 67)) {
      e.preventDefault();
      return false;
    }
  });
};

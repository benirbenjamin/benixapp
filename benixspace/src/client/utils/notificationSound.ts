/**
 * Benix.Space Web Audio Sound Synthesizer & Web Push Manager
 * Generates pleasant chimes and pop sounds using standard Web Audio API
 * (100% offline, 0 external asset latency or 404s)
 */

class SoundService {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('benix_sound_enabled');
      this.soundEnabled = saved !== null ? saved === 'true' : true;
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('benix_sound_enabled', String(enabled));
    }
  }

  /**
   * Notification Chime: Two ascending pure sine tones (587Hz -> 880Hz)
   */
  public playNotificationChime(): void {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Tone 1: D5 (587.33 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Tone 2: A5 (880.00 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.0, now + 0.12);
      gain2.gain.setValueAtTime(0.22, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);
    } catch (e) {
      // Audio playback may be blocked before first user gesture
    }
  }

  /**
   * Message Sound: Soft wooden bubble pop tone
   */
  public playMessageSound(): void {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      // Ignore audio block
    }
  }

  /**
   * Request and trigger simple Browser Web Push Notification
   */
  public async requestPushPermissionAndSend(
    title: string,
    options?: { body?: string; icon?: string; url?: string }
  ): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    let permission = Notification.permission;
    if (permission !== 'granted' && permission !== 'denied') {
      permission = await Notification.requestPermission();
    }

    if (permission === 'granted') {
      this.playNotificationChime();

      // Modern browsers & PWAs: Use ServiceWorker registration to guarantee display in OS tray
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          if (reg && 'showNotification' in reg) {
            await reg.showNotification(title, {
              body: options?.body || 'New update on Benix.Space Unified Platform',
              icon: options?.icon || '/logo.png',
              badge: '/logo.png',
              vibrate: [200, 100, 200],
              tag: 'benix-' + Date.now(),
              renotify: true,
              data: { url: options?.url || '/' }
            });
            return true;
          }
        } catch {
          // fallback to new Notification
        }
      }

      try {
        const notif = new Notification(title, {
          body: options?.body || 'New update on Benix.Space Unified Platform',
          icon: options?.icon || '/logo.png',
          badge: '/logo.png'
        });

        if (options?.url) {
          notif.onclick = () => {
            window.focus();
            window.location.href = options.url!;
          };
        }
        return true;
      } catch (err) {
        console.warn('Notification constructor error:', err);
        return false;
      }
    }
    return false;
  }
}

export const notificationSound = new SoundService();

import { createClient } from '../supabase/client';
import { PlatformPaymentSettings } from '../types/database.types';

export const platformSettingsService = {
  async getSettings(): Promise<PlatformPaymentSettings> {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/admin/settings', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          return {
            google_pay_enabled: data.google_pay_enabled ?? true,
            flutterwave_enabled: data.flutterwave_enabled ?? true,
            flutterwave_secret_key: data.flutterwave_secret_key || null,
            flutterwave_public_key: data.flutterwave_public_key || null,
          };
        }
      }
    } catch {}

    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('id', 'global')
        .maybeSingle();

      if (error || !data) {
        return {
          google_pay_enabled: true,
          flutterwave_enabled: true,
        };
      }

      return {
        google_pay_enabled: data.google_pay_enabled ?? true,
        flutterwave_enabled: data.flutterwave_enabled ?? true,
        flutterwave_secret_key: data.flutterwave_secret_key || null,
        flutterwave_public_key: data.flutterwave_public_key || null,
      };
    } catch {
      return {
        google_pay_enabled: true,
        flutterwave_enabled: true,
      };
    }
  },

  async updateSettings(settings: Partial<PlatformPaymentSettings>): Promise<boolean> {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) return true;
        }
      }
    } catch {}

    const supabase = createClient();
    try {
      const current = await this.getSettings();
      const merged = {
        id: 'global',
        google_pay_enabled: settings.google_pay_enabled !== undefined ? settings.google_pay_enabled : current.google_pay_enabled,
        flutterwave_enabled: settings.flutterwave_enabled !== undefined ? settings.flutterwave_enabled : current.flutterwave_enabled,
        flutterwave_secret_key: settings.flutterwave_secret_key !== undefined ? settings.flutterwave_secret_key : (current.flutterwave_secret_key || null),
        flutterwave_public_key: settings.flutterwave_public_key !== undefined ? settings.flutterwave_public_key : (current.flutterwave_public_key || null),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('platform_settings')
        .upsert(merged);

      if (error) {
        console.error('Direct update platform_settings note:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Update settings exception note:', err);
      return false;
    }
  },
};

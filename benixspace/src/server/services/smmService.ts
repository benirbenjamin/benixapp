import http from 'http';
import https from 'https';
import { query } from '../db/db';
import { WalletService } from './walletService';
import { EmailService } from './emailService';

async function getSystemSetting(key: string, defaultValue?: string): Promise<string | null> {
  const res = await query('SELECT value FROM system_settings WHERE key = $1', [key]).catch(() => ({ rowCount: 0, rows: [] }));
  if (res.rowCount > 0 && res.rows[0].value !== null && res.rows[0].value !== undefined && String(res.rows[0].value).trim() !== '') {
    return String(res.rows[0].value);
  }
  const coreRes = await query('SELECT value FROM core_system_settings WHERE key = $1', [key]).catch(() => ({ rowCount: 0, rows: [] }));
  if (coreRes.rowCount > 0 && coreRes.rows[0].value !== null && coreRes.rows[0].value !== undefined && String(coreRes.rows[0].value).trim() !== '') {
    return String(coreRes.rows[0].value);
  }
  return defaultValue !== undefined ? defaultValue : null;
}

async function setSystemSetting(key: string, value: string): Promise<void> {
  await query(
    `INSERT INTO system_settings (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
    [key, value]
  ).catch(() => {});
  await query(
    `INSERT INTO core_system_settings (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
    [key, value]
  ).catch(() => {});
}

// Memory cache for exchange rate
let cachedRate: { rate: number; timestamp: number } | null = null;

export class SmmService {
  /**
   * Real-time currency exchange rate API (USD to RWF)
   * Fetches live rate from open exchange API with 1-hour cache and DB fallback
   */
  static async getLiveExchangeRate(): Promise<number> {
    const ONE_HOUR = 3600000;
    if (cachedRate && Date.now() - cachedRate.timestamp < ONE_HOUR) {
      return cachedRate.rate;
    }

    try {
      const liveRate = await new Promise<number>((resolve, reject) => {
        https.get('https://open.er-api.com/v6/latest/USD', (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              const rwf = json.rates?.RWF;
              if (typeof rwf === 'number' && rwf > 500) {
                resolve(Number(rwf.toFixed(2)));
              } else {
                reject(new Error('Invalid RWF rate in response'));
              }
            } catch (e) {
              reject(e);
            }
          });
        }).on('error', reject);
      });

      cachedRate = { rate: liveRate, timestamp: Date.now() };
      await setSystemSetting('rwf_per_usd', String(liveRate));
      return liveRate;
    } catch (err: any) {
      console.warn('Live exchange rate API failed, checking stored fallback:', err.message);
      const dbRateStr = await getSystemSetting('rwf_per_usd', '1480');
      const fallback = parseFloat(dbRateStr || '1480') || 1480;
      cachedRate = { rate: fallback, timestamp: Date.now() };
      return fallback;
    }
  }

  static async ensureTables(): Promise<void> {
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS smm_services (
          id SERIAL PRIMARY KEY,
          service_id INT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          type TEXT DEFAULT 'Default',
          rate_usd NUMERIC(12, 4) NOT NULL,
          rate_rwf NUMERIC(12, 2) NOT NULL,
          min_quantity INT DEFAULT 10,
          max_quantity INT DEFAULT 100000,
          refill BOOLEAN DEFAULT FALSE,
          cancel BOOLEAN DEFAULT FALSE,
          is_enabled BOOLEAN DEFAULT TRUE,
          custom_markup_percent NUMERIC(5, 2) DEFAULT 30.00,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `).catch(() => {});

      await query(`
        CREATE TABLE IF NOT EXISTS smm_orders (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          service_id INT NOT NULL,
          service_name TEXT NOT NULL,
          category TEXT NOT NULL,
          link TEXT NOT NULL,
          quantity INT NOT NULL,
          charge_rwf NUMERIC(15, 2) NOT NULL,
          charge_usd NUMERIC(12, 4) NOT NULL,
          external_order_id VARCHAR(100),
          status VARCHAR(50) DEFAULT 'pending',
          status_details JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `).catch(() => {});

      await query(`
        CREATE TABLE IF NOT EXISTS admin_notifications (
          id SERIAL PRIMARY KEY,
          type VARCHAR(50) NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          metadata JSONB,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `).catch(() => {});
    } catch (err: any) {
      console.warn('ensureTables non-fatal:', err.message);
    }
  }

  static async callApi(action: string, extraParams: Record<string, any> = {}): Promise<any> {
    const apiKey = (await getSystemSetting('smm_api_key')) || '4eb27fc1b22e70e9f168bc6391d4e7ef';
    const apiUrl = (await getSystemSetting('smm_api_url')) || 'https://smmfollows.com/api/v2';

    const params = new URLSearchParams({
      key: apiKey.trim(),
      action: action.trim(),
      ...Object.fromEntries(
        Object.entries(extraParams).map(([k, v]) => [k, String(v !== undefined && v !== null ? v : '')])
      )
    });
    const postData = params.toString();

    return new Promise((resolve) => {
      try {
        const urlObj = new URL(apiUrl);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;

        const req = client.request(
          {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + (urlObj.search || ''),
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Content-Length': Buffer.byteLength(postData),
              'User-Agent': 'BenixSpace/2.0'
            }
          },
          (res) => {
            let body = '';
            res.on('data', (c) => (body += c));
            res.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                resolve(parsed);
              } catch {
                resolve({ raw: body });
              }
            });
          }
        );

        req.setTimeout(10000, () => {
          req.destroy(new Error('SMM API timeout'));
          resolve({ error: 'SMM API connection timed out.' });
        });

        req.on('error', (err) => {
          resolve({ error: err.message || 'Network error contacting SMM provider.' });
        });

        req.write(postData);
        req.end();
      } catch (err: any) {
        resolve({ error: err.message || 'Invalid API URL' });
      }
    });
  }

  static async alertAdminLowBalance(details: {
    orderId?: number;
    userId: string;
    serviceName: string;
    chargeUsd: number;
    chargeRwf: number;
    currentBalance?: number | string;
  }): Promise<void> {
    const adminEmail = process.env.SUPERADMIN_EMAIL || 'benirabok@gmail.com';
    const balDisplay = details.currentBalance !== undefined ? `$${details.currentBalance}` : 'low';
    const adminMsg = `⚠️ Low SMM Follows Balance! User #${details.userId} wants to order "${details.serviceName}" costing $${details.chargeUsd} USD (${details.chargeRwf.toLocaleString()} RWF). Current SMM balance is ${balDisplay}. Please deposit funds on https://smmfollows.com immediately so the order can run.`;

    await query(
      `INSERT INTO admin_notifications (type, title, message, metadata)
       VALUES ('low_smm_balance', '⚠️ SMM Deposit Required', $1, $2)`,
      [adminMsg, JSON.stringify(details)]
    ).catch(() => {});

    try {
      await EmailService.sendEmail({
        to: adminEmail,
        subject: `🚨 Action Required: Deposit SMM Balance on SMMFollows.com`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 16px; border: 2px solid #ef4444;">
            <h2 style="color: #ef4444; margin-top: 0;">⚠️ SMM Follows Balance Low - Deposit Required</h2>
            <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1;">
              A user placed a Social Media Boost order, but your balance on <strong>smmfollows.com</strong> is low or insufficient.
            </p>
            <div style="background: #1e293b; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #334155;">
              <p style="margin: 6px 0;"><strong>Service:</strong> ${details.serviceName}</p>
              <p style="margin: 6px 0;"><strong>Required Cost (USD):</strong> $${details.chargeUsd}</p>
              <p style="margin: 6px 0;"><strong>Paid by User (RWF):</strong> ${details.chargeRwf.toLocaleString()} RWF (debited from user's real wallet)</p>
              <p style="margin: 6px 0;"><strong>Order Status:</strong> Queued as <span style="color: #f59e0b; font-weight: bold;">pending_deposit</span></p>
            </div>
            <p style="font-size: 14px; color: #94a3b8;">
              Please log into <a href="https://smmfollows.com" style="color: #38bdf8;">smmfollows.com</a>, deposit funds, and BenixSpace will automatically execute the queued order.
            </p>
          </div>
        `
      });
    } catch (err: any) {
      console.warn('Failed to send SMM balance email alert:', err.message);
    }
  }

  static async getBalance(): Promise<{ success: boolean; balance: number; currency: string; error?: string }> {
    try {
      const data = await this.callApi('balance');
      if (data?.error) {
        return { success: false, balance: 0, currency: 'USD', error: data.error };
      }
      return { success: true, balance: Number(data?.balance || 0), currency: data?.currency || 'USD' };
    } catch (err: any) {
      return { success: false, balance: 0, currency: 'USD', error: err.message };
    }
  }

  static async seedDefaultServicesIfEmpty(): Promise<void> {
    try {
      const countRes = await query('SELECT COUNT(*) as count FROM smm_services');
      const count = Number(countRes.rows[0]?.count || 0);
      if (count > 0) return;

      const rwfRate = await this.getLiveExchangeRate();
      const markup = 30; // 30% default profit

      const defaultServices = [
        { service_id: 101, name: 'Instagram Followers (HQ Real & Active - High Retention)', category: 'Instagram Boost', rate_usd: 1.20, min: 50, max: 50000, refill: true },
        { service_id: 102, name: 'Instagram Likes (Instant Delivery - Non-Drop)', category: 'Instagram Boost', rate_usd: 0.45, min: 20, max: 20000, refill: true },
        { service_id: 103, name: 'Instagram Reels Views + Reach Boost', category: 'Instagram Boost', rate_usd: 0.15, min: 100, max: 500000, refill: true },
        { service_id: 201, name: 'TikTok Followers (Real Organic Worldwide Profiles)', category: 'TikTok Boost', rate_usd: 1.60, min: 50, max: 100000, refill: true },
        { service_id: 202, name: 'TikTok Likes & Hearts (Fast Delivery)', category: 'TikTok Boost', rate_usd: 0.35, min: 50, max: 50000, refill: true },
        { service_id: 203, name: 'TikTok Video Views (Viral Algorithm Booster)', category: 'TikTok Boost', rate_usd: 0.10, min: 200, max: 1000000, refill: true },
        { service_id: 301, name: 'YouTube Subscribers (Real Profiles - Non-Drop 30-Day)', category: 'YouTube Growth', rate_usd: 4.80, min: 50, max: 10000, refill: true },
        { service_id: 302, name: 'YouTube Video Views (High Retention - Monetizable)', category: 'YouTube Growth', rate_usd: 1.90, min: 100, max: 100000, refill: true },
        { service_id: 303, name: 'YouTube Watch Hours (4000h Monetization Booster)', category: 'YouTube Growth', rate_usd: 12.00, min: 100, max: 4000, refill: true },
        { service_id: 401, name: 'Facebook Page Likes & Real Followers', category: 'Facebook Growth', rate_usd: 2.10, min: 50, max: 25000, refill: true },
        { service_id: 402, name: 'Facebook Post Likes & Reactions', category: 'Facebook Growth', rate_usd: 0.60, min: 50, max: 10000, refill: true },
        { service_id: 501, name: 'X / Twitter Followers (Worldwide Active)', category: 'X (Twitter) Boost', rate_usd: 3.20, min: 50, max: 20000, refill: true },
        { service_id: 502, name: 'X / Twitter Retweets & Likes Combo', category: 'X (Twitter) Boost', rate_usd: 1.10, min: 25, max: 10000, refill: true },
        { service_id: 601, name: 'Telegram Channel Members (Zero Drop - Guaranteed)', category: 'Telegram Channels', rate_usd: 1.40, min: 50, max: 50000, refill: true },
        { service_id: 701, name: 'Spotify Music Plays (Royalties Eligible Streams)', category: 'Music & Audio', rate_usd: 1.80, min: 500, max: 100000, refill: true }
      ];

      for (const s of defaultServices) {
        const rateRwf = Math.ceil(s.rate_usd * rwfRate * (1 + markup / 100));
        await query(
          `INSERT INTO smm_services (
            service_id, name, category, type, rate_usd, rate_rwf, min_quantity, max_quantity, refill, cancel, is_enabled, custom_markup_percent
          ) VALUES ($1, $2, $3, 'Default', $4, $5, $6, $7, $8, FALSE, TRUE, $9)
          ON CONFLICT (service_id) DO NOTHING`,
          [s.service_id, s.name, s.category, s.rate_usd, rateRwf, s.min, s.max, s.refill, markup]
        ).catch(() => {});
      }
    } catch (e: any) {
      console.warn('seedDefaultServicesIfEmpty non-fatal:', e.message);
    }
  }

  static async getServices(showAll: boolean = false): Promise<any[]> {
    await this.ensureTables();
    await this.seedDefaultServicesIfEmpty();
    try {
      const queryStr = showAll
        ? 'SELECT * FROM smm_services ORDER BY category ASC, rate_rwf ASC'
        : 'SELECT * FROM smm_services WHERE is_enabled = TRUE ORDER BY category ASC, rate_rwf ASC';
      const res = await query(queryStr);
      return res.rows;
    } catch {
      return [];
    }
  }

  static async syncServices(): Promise<{ success: boolean; count: number; error?: string; message?: string }> {
    await this.ensureTables();
    const services = await this.callApi('services');
    if (!Array.isArray(services)) {
      await this.seedDefaultServicesIfEmpty();
      const currentServices = await this.getServices(true);
      return {
        success: currentServices.length > 0,
        count: currentServices.length,
        error: services?.error ? `SMM Provider response: ${services.error}` : 'Unable to sync live services. Initial services catalog active.'
      };
    }

    const defaultMarkup = Number(await getSystemSetting('smm_default_markup_percent', '30')) || 30;
    const rwfRate = await this.getLiveExchangeRate();

    let syncedCount = 0;
    for (const s of services) {
      if (!s.service || !s.name) continue;
      const rateUsd = Number(s.rate || 0);
      const rateRwf = Math.ceil(rateUsd * rwfRate * (1 + defaultMarkup / 100));

      await query(
        `INSERT INTO smm_services (
          service_id, name, category, type, rate_usd, rate_rwf, min_quantity, max_quantity, refill, cancel, custom_markup_percent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (service_id) DO UPDATE SET
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          type = EXCLUDED.type,
          rate_usd = EXCLUDED.rate_usd,
          rate_rwf = CASE 
            WHEN smm_services.custom_markup_percent IS NOT NULL 
            THEN CEIL(EXCLUDED.rate_usd * $12 * (1 + smm_services.custom_markup_percent / 100))
            ELSE EXCLUDED.rate_rwf
          END,
          min_quantity = EXCLUDED.min_quantity,
          max_quantity = EXCLUDED.max_quantity,
          refill = EXCLUDED.refill,
          cancel = EXCLUDED.cancel,
          updated_at = CURRENT_TIMESTAMP`,
        [
          Number(s.service),
          s.name,
          s.category || 'General',
          s.type || 'Default',
          rateUsd,
          rateRwf,
          parseInt(s.min) || 10,
          parseInt(s.max) || 100000,
          Boolean(s.refill),
          Boolean(s.cancel),
          defaultMarkup,
          rwfRate
        ]
      ).catch(() => {});
      syncedCount++;
    }

    return { success: true, count: syncedCount, message: `Successfully synced ${syncedCount} services from SMMFollows.` };
  }

  static async toggleService(id: string | number, isEnabled?: boolean): Promise<any> {
    await this.ensureTables();
    let res;
    if (isEnabled !== undefined) {
      res = await query('UPDATE smm_services SET is_enabled = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *', [Boolean(isEnabled), id]);
    } else {
      res = await query('UPDATE smm_services SET is_enabled = NOT is_enabled, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *', [id]);
    }
    return res.rows[0];
  }

  static async updatePricing(id: string | number, markup?: number, rateRwf?: number): Promise<any> {
    await this.ensureTables();
    const rwfRate = await this.getLiveExchangeRate();
    let res;
    if (markup !== undefined) {
      res = await query(
        `UPDATE smm_services 
         SET custom_markup_percent = $1, 
             rate_rwf = CEIL(rate_usd * $2 * (1 + $1 / 100)),
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3 RETURNING *`,
        [Number(markup), rwfRate, id]
      );
    } else if (rateRwf !== undefined) {
      res = await query('UPDATE smm_services SET rate_rwf = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *', [Number(rateRwf), id]);
    }
    return res?.rows[0];
  }

  static async getSettings(): Promise<any> {
    const apiKey = (await getSystemSetting('smm_api_key')) || '4eb27fc1b22e70e9f168bc6391d4e7ef';
    const apiUrl = (await getSystemSetting('smm_api_url')) || 'https://smmfollows.com/api/v2';
    const defaultMarkup = Number(await getSystemSetting('smm_default_markup_percent', '30')) || 30;
    const rwfPerUsd = await this.getLiveExchangeRate();
    return { apiKey, apiUrl, defaultMarkup, rwfPerUsd };
  }

  static async saveSettings(apiKey?: string, defaultMarkup?: number, rwfPerUsd?: number): Promise<void> {
    if (apiKey !== undefined) await setSystemSetting('smm_api_key', String(apiKey).trim());
    if (defaultMarkup !== undefined) await setSystemSetting('smm_default_markup_percent', String(defaultMarkup));
    if (rwfPerUsd !== undefined) await setSystemSetting('rwf_per_usd', String(rwfPerUsd));
  }

  static async placeOrder(userId: string, serviceId: number | string, link: string, quantity: number): Promise<any> {
    await this.ensureTables();
    const qty = parseInt(String(quantity));
    const sRes = await query('SELECT * FROM smm_services WHERE (id = $1 OR service_id = $1) AND is_enabled = TRUE', [serviceId]);
    if (sRes.rowCount === 0) {
      throw new Error('Selected service is currently unavailable or disabled.');
    }

    const svc = sRes.rows[0];
    if (qty < svc.min_quantity || qty > svc.max_quantity) {
      throw new Error(`Quantity must be between ${svc.min_quantity.toLocaleString()} and ${svc.max_quantity.toLocaleString()}.`);
    }

    const chargeRwf = Math.ceil(Number(svc.rate_rwf) * (qty / 1000));
    const chargeUsd = Number((Number(svc.rate_usd) * (qty / 1000)).toFixed(4));

    // 1. Debit User's Real Wallet Strictly (never from bonus wallet)
    await WalletService.debit(
      userId,
      chargeRwf,
      'smm',
      'smm_boost_order',
      `Social Boost: ${svc.name} (${qty.toLocaleString()})`,
      `smm_ord_${Date.now()}`,
      { service_id: svc.service_id, service_name: svc.name, quantity: qty, target_link: link, charge_usd: chargeUsd }
    );

    // 2. Check SMM Provider USD balance
    let smmBal: any = null;
    try {
      smmBal = await this.callApi('balance');
    } catch {}

    const currentUsdBal = smmBal && smmBal.balance !== undefined ? Number(smmBal.balance) : 0;

    // 3. If balance is low or SMM API returned error, queue order as pending_deposit & alert Admin
    if (smmBal?.error || currentUsdBal < chargeUsd) {
      const ordRes = await query(
        `INSERT INTO smm_orders (
          user_id, service_id, service_name, category, link, quantity, charge_rwf, charge_usd, status, status_details
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending_deposit', $9) RETURNING *`,
        [
          userId,
          svc.service_id,
          svc.name,
          svc.category,
          link.trim(),
          qty,
          chargeRwf,
          chargeUsd,
          JSON.stringify({ reason: smmBal?.error || 'insufficient_provider_balance', currentBalance: currentUsdBal })
        ]
      );

      await this.alertAdminLowBalance({
        orderId: ordRes.rows[0].id,
        userId,
        serviceName: svc.name,
        chargeUsd,
        chargeRwf,
        currentBalance: currentUsdBal
      });

      return {
        success: true,
        order: ordRes.rows[0],
        status: 'pending_deposit',
        message: 'Order received and queued. Will execute as soon as provider balance confirms.'
      };
    }

    // 4. Sufficient balance: place immediately on smmfollows.com
    const addRes = await this.callApi('add', {
      service: svc.service_id,
      link: link.trim(),
      quantity: qty
    });

    if (addRes && addRes.order) {
      const ordRes = await query(
        `INSERT INTO smm_orders (
          user_id, service_id, service_name, category, link, quantity, charge_rwf, charge_usd, external_order_id, status, status_details
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'in_progress', $10) RETURNING *`,
        [
          userId,
          svc.service_id,
          svc.name,
          svc.category,
          link.trim(),
          qty,
          chargeRwf,
          chargeUsd,
          String(addRes.order),
          JSON.stringify(addRes)
        ]
      );
      return {
        success: true,
        order: ordRes.rows[0],
        status: 'in_progress',
        externalOrderId: addRes.order,
        message: 'Order placed successfully and processing on provider network!'
      };
    } else {
      // API call returned error or failed
      const ordRes = await query(
        `INSERT INTO smm_orders (
          user_id, service_id, service_name, category, link, quantity, charge_rwf, charge_usd, status, status_details
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending_deposit', $9) RETURNING *`,
        [
          userId,
          svc.service_id,
          svc.name,
          svc.category,
          link.trim(),
          qty,
          chargeRwf,
          chargeUsd,
          JSON.stringify(addRes || {})
        ]
      );

      await this.alertAdminLowBalance({
        orderId: ordRes.rows[0].id,
        userId,
        serviceName: svc.name,
        chargeUsd,
        chargeRwf,
        currentBalance: currentUsdBal
      });

      return {
        success: true,
        order: ordRes.rows[0],
        status: 'pending_deposit',
        message: 'Order received and queued for execution.'
      };
    }
  }

  static async getUserOrders(userId: string): Promise<any[]> {
    await this.ensureTables();
    try {
      const res = await query('SELECT * FROM smm_orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [userId]);
      return res.rows;
    } catch {
      return [];
    }
  }

  static async getAllOrders(): Promise<{ orders: any[]; pendingCount: number }> {
    await this.ensureTables();
    try {
      const ordRes = await query(`
        SELECT o.*, u.email as user_email, u.name as user_name 
        FROM smm_orders o 
        LEFT JOIN core_users u ON o.user_id = u.id 
        ORDER BY o.created_at DESC 
        LIMIT 100
      `);
      const pRes = await query("SELECT COUNT(*) as count FROM smm_orders WHERE status = 'pending_deposit'");
      return {
        orders: ordRes.rows,
        pendingCount: Number(pRes.rows[0]?.count || 0)
      };
    } catch {
      return { orders: [], pendingCount: 0 };
    }
  }

  static async retryPendingOrder(orderId: number | string): Promise<{ success: boolean; message: string }> {
    await this.ensureTables();
    const ordRes = await query('SELECT * FROM smm_orders WHERE id = $1', [orderId]);
    if (ordRes.rowCount === 0) throw new Error('Order not found');

    const ord = ordRes.rows[0];
    const addRes = await this.callApi('add', {
      service: ord.service_id,
      link: ord.link,
      quantity: ord.quantity
    });

    if (addRes && addRes.order) {
      await query(
        "UPDATE smm_orders SET external_order_id = $1, status = 'in_progress', status_details = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
        [String(addRes.order), JSON.stringify(addRes), orderId]
      );
      return { success: true, message: `Order #${orderId} submitted to provider as #${addRes.order}!` };
    } else {
      throw new Error(addRes?.error || 'Provider rejected order submission. Check balance or credentials.');
    }
  }

  static async getNotifications(): Promise<any[]> {
    await this.ensureTables();
    try {
      const res = await query('SELECT * FROM admin_notifications ORDER BY created_at DESC LIMIT 30');
      return res.rows;
    } catch {
      return [];
    }
  }
}

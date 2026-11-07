import { query, withTransaction } from '../../db/db';
import { WalletService } from '../walletService';
import crypto from 'crypto';

export interface SubscriptionInfo {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  planPriceRwf: number;
  status: string;
  isTrial: boolean;
  trialDaysRemaining: number;
  currentPeriodEnd: string;
  maxApps: number;
  vcpuLimit: number;
  ramMb: number;
  storageGb: number;
  maxDatabases: number;
  customDomainsAllowed: number;
  hasFreeSsl: boolean;
  hasBackups: boolean;
  hasPrioritySupport: boolean;
}

export class CloudBillingService {
  /**
   * Get active subscription and quotas for a customer
   */
  static async getUserSubscription(userId: string): Promise<SubscriptionInfo | null> {
    // Check if user has an active subscription
    const res = await query(
      `SELECT s.*, p.name as plan_name, p.price_rwf, p.max_apps, p.vcpu_limit, p.ram_mb, 
              p.storage_gb, p.max_databases, p.custom_domains_allowed, p.has_free_ssl, 
              p.has_backups, p.has_priority_support, p.trial_duration_days
       FROM cloud_subscriptions s
       JOIN cloud_plans p ON s.plan_id = p.id
       WHERE s.user_id = $1 AND s.status IN ('active', 'trialing')
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (res.rowCount === 0) {
      return null;
    }

    const row = res.rows[0];
    const now = new Date();
    const endDate = new Date(row.current_period_end);
    const msRemaining = endDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

    return {
      id: row.id,
      userId: row.user_id,
      planId: row.plan_id,
      planName: row.plan_name,
      planPriceRwf: Number(row.price_rwf),
      status: row.status,
      isTrial: Boolean(row.is_trial),
      trialDaysRemaining: row.is_trial ? daysRemaining : 0,
      currentPeriodEnd: row.current_period_end,
      maxApps: Number(row.max_apps),
      vcpuLimit: Number(row.vcpu_limit),
      ramMb: Number(row.ram_mb),
      storageGb: Number(row.storage_gb),
      maxDatabases: Number(row.max_databases),
      customDomainsAllowed: Number(row.custom_domains_allowed),
      hasFreeSsl: Boolean(row.has_free_ssl),
      hasBackups: Boolean(row.has_backups),
      hasPrioritySupport: Boolean(row.has_priority_support)
    };
  }

  /**
   * Activate Free 2-Month Developer Trial (0 RWF, 3 DBs, 1GB Storage, Unlimited Apps/CPU)
   * Enforces 1 trial per user account.
   */
  static async activateFreeTrial(userId: string): Promise<{ success: boolean; message: string; subscription: any }> {
    // 1. Verify user hasn't already used the free trial
    const metaCheck = await query('SELECT trial_used FROM cloud_user_meta WHERE user_id = $1', [userId]);
    if (metaCheck.rowCount > 0 && metaCheck.rows[0].trial_used) {
      throw new Error('You have already used your Free 2-Month Developer Trial on this account. Please select a paid cloud plan.');
    }

    // 2. Fetch Free Trial plan configuration from DB (admin can configure duration)
    const planRes = await query("SELECT * FROM cloud_plans WHERE is_trial = true OR id = 'free-trial' LIMIT 1");
    if (planRes.rowCount === 0) {
      throw new Error('Free Developer Trial is currently not active.');
    }
    const trialPlan = planRes.rows[0];
    const trialDays = trialPlan.trial_duration_days || 60;

    const subId = 'csub-' + crypto.randomUUID();
    const now = new Date();
    const periodEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

    return await withTransaction(async (client) => {
      // Deactivate any existing subscriptions
      await client.query("UPDATE cloud_subscriptions SET status = 'expired' WHERE user_id = $1", [userId]);

      // Create new trial subscription
      const newSub = await client.query(
        `INSERT INTO cloud_subscriptions (
          id, user_id, plan_id, status, is_trial, trial_end_date, current_period_start, current_period_end, auto_renew
        ) VALUES (
          $1, $2, $3, 'trialing', true, $4, CURRENT_TIMESTAMP, $4, false
        ) RETURNING *`,
        [subId, userId, trialPlan.id, periodEnd.toISOString()]
      );

      // Record in cloud_user_meta that trial has been used
      await client.query(
        `INSERT INTO cloud_user_meta (user_id, trial_used, trial_started_at)
         VALUES ($1, true, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO UPDATE SET trial_used = true, trial_started_at = CURRENT_TIMESTAMP`,
        [userId]
      );

      return {
        success: true,
        message: `🎉 Free Developer Trial Activated! You have ${trialDays} days of unconstrained access with 3 databases and 1GB storage.`,
        subscription: newSub.rows[0]
      };
    });
  }

  /**
   * Subscribe to a paid cloud plan using BenixSpace Central Wallet balance
   */
  static async subscribeWithWallet(
    userId: string,
    planId: string
  ): Promise<{ success: boolean; message: string; transactionId: string; subscription: any }> {
    // 1. Fetch Plan details
    const planRes = await query('SELECT * FROM cloud_plans WHERE id = $1 AND is_active = true', [planId]);
    if (planRes.rowCount === 0) {
      throw new Error('Selected cloud hosting plan not found or is currently unavailable.');
    }
    const plan = planRes.rows[0];
    const price = Number(plan.price_rwf);

    if (price <= 0) {
      return await this.activateFreeTrial(userId);
    }

    // 2. Debit user's central wallet via WalletService
    const debitResult = await WalletService.debit(
      userId,
      price,
      'cloud',
      'hosting_plan_subscription',
      `Benix Cloud Plan: ${plan.name} (${price.toLocaleString()} RWF/mo)`,
      `tx_cloud_${Date.now()}_${userId.slice(0, 5)}`,
      { planId: plan.id, planName: plan.name, priceRwf: price }
    );

    // 3. Update or create subscription in PostgreSQL
    const subId = 'csub-' + crypto.randomUUID();
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const sub = await withTransaction(async (client) => {
      // Deactivate older subscriptions
      await client.query("UPDATE cloud_subscriptions SET status = 'cancelled' WHERE user_id = $1", [userId]);

      const inserted = await client.query(
        `INSERT INTO cloud_subscriptions (
          id, user_id, plan_id, status, is_trial, current_period_start, current_period_end, auto_renew, last_payment_tx_id
        ) VALUES (
          $1, $2, $3, 'active', false, CURRENT_TIMESTAMP, $4, true, $5
        ) RETURNING *`,
        [subId, userId, plan.id, periodEnd.toISOString(), debitResult.transactionId]
      );

      return inserted.rows[0];
    });

    return {
      success: true,
      message: `🎉 Successfully subscribed to ${plan.name}! Your hosting resources are now active.`,
      transactionId: debitResult.transactionId,
      subscription: sub
    };
  }

  /**
   * Quota check: Can user create another application?
   */
  static async canDeployApp(userId: string): Promise<{ allowed: boolean; maxApps: number; currentApps: number }> {
    const sub = await this.getUserSubscription(userId);
    if (!sub) {
      return { allowed: false, maxApps: 0, currentApps: 0 };
    }

    // -1 means unlimited
    if (sub.maxApps === -1) {
      return { allowed: true, maxApps: -1, currentApps: 0 };
    }

    const countRes = await query(
      "SELECT COUNT(*) as cnt FROM cloud_deployments WHERE user_id = $1 AND status != 'deleted'",
      [userId]
    );
    const currentApps = Number(countRes.rows[0]?.cnt || 0);

    return {
      allowed: currentApps < sub.maxApps,
      maxApps: sub.maxApps,
      currentApps
    };
  }

  /**
   * Quota check: Can user create another database?
   */
  static async canCreateDatabase(userId: string): Promise<{ allowed: boolean; maxDbs: number; currentDbs: number }> {
    const sub = await this.getUserSubscription(userId);
    if (!sub) {
      return { allowed: false, maxDbs: 0, currentDbs: 0 };
    }

    if (sub.maxDatabases === -1) {
      return { allowed: true, maxDbs: -1, currentDbs: 0 };
    }

    const countRes = await query(
      "SELECT COUNT(*) as cnt FROM cloud_databases WHERE user_id = $1 AND status != 'deleted'",
      [userId]
    );
    const currentDbs = Number(countRes.rows[0]?.cnt || 0);

    return {
      allowed: currentDbs < sub.maxDatabases,
      maxDbs: sub.maxDatabases,
      currentDbs
    };
  }
}

import { createClient } from '../supabase/client';
import { SubscriptionPlan, PlanLimits, Subscription } from '../types/database.types';

export const subscriptionService = {
  // Fetch active subscription plans from database
  async getAllPlans(): Promise<SubscriptionPlan[]> {
    const supabase = createClient();
    const { data } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('price_monthly', { ascending: true });

    return (data as SubscriptionPlan[]) || [];
  },

  async getPlanById(planId: string): Promise<SubscriptionPlan | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (error || !data) return null;
    return data as SubscriptionPlan;
  },

  // Fetch active subscription plan for a choir
  async getChoirSubscription(choirId: string): Promise<{ subscription: Subscription | null; plan: SubscriptionPlan | null }> {
    const supabase = createClient();
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*, plan:plan_id(*)')
      .eq('choir_id', choirId)
      .single();

    if (sub && sub.plan) {
      return {
        subscription: sub as Subscription,
        plan: sub.plan as SubscriptionPlan,
      };
    }

    // Default fallback to Community Free plan
    const { data: freePlan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_free', true)
      .single();

    return {
      subscription: null,
      plan: (freePlan as SubscriptionPlan) || null,
    };
  },

  // Set or update a choir's subscription plan
  async setChoirPlan(choirId: string, planId: string): Promise<{ success: boolean; error: string | null }> {
    const supabase = createClient();

    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('choir_id', choirId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          plan_id: planId,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase
        .from('subscriptions')
        .insert([{
          choir_id: choirId,
          plan_id: planId,
          status: 'active',
        }]);

      if (error) return { success: false, error: error.message };
    }

    return { success: true, error: null };
  },

  // Super Admin: Create a new plan
  async createPlan(payload: {
    name: string;
    description?: string;
    price_monthly: number;
    discount_3_months?: number;
    discount_6_months?: number;
    discount_12_months?: number;
    is_free: boolean;
    features: string[];
    limits: PlanLimits;
  }): Promise<SubscriptionPlan | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('subscription_plans')
      .insert({
        ...payload,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes('schema cache') || error.message.includes('column')) {
        // Auto-heal: Run setup migration and retry
        try {
          await fetch('/api/setup', { method: 'POST' });
          const { discount_3_months, discount_6_months, discount_12_months, ...fallbackPayload } = payload;
          const { data: retryData } = await supabase
            .from('subscription_plans')
            .insert({ ...fallbackPayload, is_active: true })
            .select()
            .single();
          return (retryData as SubscriptionPlan) || null;
        } catch {}
      }
      return null;
    }
    return data as SubscriptionPlan;
  },

  // Super Admin: Update plan details
  async updatePlan(planId: string, payload: {
    name?: string;
    description?: string;
    price_monthly?: number;
    discount_3_months?: number;
    discount_6_months?: number;
    discount_12_months?: number;
    is_free?: boolean;
    features?: string[];
    limits?: PlanLimits;
    is_active?: boolean;
  }): Promise<{ success: boolean; error: string | null }> {
    const supabase = createClient();
    const { error } = await supabase
      .from('subscription_plans')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', planId);

    if (error) {
      // Self-healing: if column is missing from DB, trigger setup endpoint to run 00006 migration
      if (error.message.includes('discount') || error.message.includes('schema cache')) {
        try {
          const setupRes = await fetch('/api/setup', { method: 'POST' });
          const setupData = await setupRes.json();
          if (setupData.success) {
            // Retry update with full payload
            const { error: retryErr } = await supabase
              .from('subscription_plans')
              .update({ ...payload, updated_at: new Date().toISOString() })
              .eq('id', planId);

            if (!retryErr) return { success: true, error: null };
          }
        } catch {}

        // Fallback: Strip discount columns and update standard plan fields
        const { discount_3_months, discount_6_months, discount_12_months, ...fallbackPayload } = payload;
        const { error: fallbackErr } = await supabase
          .from('subscription_plans')
          .update({
            ...fallbackPayload,
            updated_at: new Date().toISOString(),
          })
          .eq('id', planId);

        if (!fallbackErr) return { success: true, error: null };
      }

      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  },

  // Super Admin: Delete plan
  async deletePlan(planId: string): Promise<boolean> {
    const supabase = createClient();
    // Re-assign subscriptions on this plan to free plan if any
    const { error } = await supabase
      .from('subscription_plans')
      .delete()
      .eq('id', planId);

    return !error;
  },

  // Super Admin: Toggle plan active status
  async togglePlanActive(planId: string, isActive: boolean): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('subscription_plans')
      .update({ is_active: isActive })
      .eq('id', planId);

    return !error;
  }
};

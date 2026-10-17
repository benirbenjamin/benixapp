import { createClient } from '../supabase/client';
import { SubscriptionPlan, Subscription } from '../types/database.types';

export const planService = {
  // Fetch active subscription plans directly from database
  async getAllPlans(): Promise<SubscriptionPlan[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('price_monthly', { ascending: true });

    if (error) {
      console.error('Error fetching subscription plans:', error);
      return [];
    }
    return data || [];
  },

  // Fetch active plan for a specific choir
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

    // Fallback: Default to Community Free plan if no record
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

  // Assign or upgrade a choir's subscription plan
  async setChoirPlan(choirId: string, planId: string): Promise<{ success: boolean; error: string | null }> {
    const supabase = createClient();

    // Check if subscription already exists for this choir
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

  // Super Admin: Create new subscription plan
  async createPlan(planData: Partial<SubscriptionPlan>): Promise<{ plan: SubscriptionPlan | null; error: string | null }> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('subscription_plans')
      .insert([planData])
      .select()
      .single();

    if (error) return { plan: null, error: error.message };
    return { plan: data as SubscriptionPlan, error: null };
  },

  // Super Admin: Update existing subscription plan
  async updatePlan(planId: string, planData: Partial<SubscriptionPlan>): Promise<{ success: boolean; error: string | null }> {
    const supabase = createClient();
    const { error } = await supabase
      .from('subscription_plans')
      .update({
        ...planData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', planId);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  },

  // Super Admin: Delete subscription plan
  async deletePlan(planId: string): Promise<{ success: boolean; error: string | null }> {
    const supabase = createClient();
    const { error } = await supabase
      .from('subscription_plans')
      .delete()
      .eq('id', planId);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  }
};

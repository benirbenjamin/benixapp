import { createClient } from '../supabase/client';
import { FinancialLedgerEntry, MarketplaceSettings, WithdrawalRequest, WithdrawalStatus } from '../types/database.types';
import { notificationService } from './notificationService';

export interface ArtistFinancialSummary {
  totalSalesCount: number;
  totalRevenue: number; // total gross sales
  platformFeesPaid: number;
  totalEarnings: number; // net total earned by artist
  availableBalance: number; // net earnings minus processed withdrawals
  pendingWithdrawalAmount: number;
}

export interface MarketplacePlatformAnalytics {
  totalGrossSales: number;
  platformCommissionRevenue: number;
  artistsNetRevenue: number;
  totalPaidOut: number;
  totalPendingPayouts: number;
  totalSongsCount: number;
  totalSoldSongsCount: number;
  purchases: Array<{
    id: string;
    order_ref: string;
    amount_paid: number;
    currency: string;
    purchased_at: string;
    song?: any;
    buyer?: any;
    platformFee: number;
    netArtist: number;
  }>;
  artistStats: Array<{
    artistId: string;
    stageName: string;
    realName: string;
    email: string;
    phone: string;
    avatarUrl?: string | null;
    status: string;
    payoutDetails: any;
    songsCount: number;
    songsSoldCount: number;
    grossSales: number;
    netEarnings: number;
    paidOut: number;
    pendingPayouts: number;
    availableBalance: number;
  }>;
}

export const financialService = {
  async getArtistFinancialSummary(artistId: string): Promise<ArtistFinancialSummary> {
    const supabase = createClient();

    // Fetch all ledger entries, artist songs, purchases, and withdrawals in parallel
    const [ledgerRes, songsRes, withdrawalsRes, settings] = await Promise.all([
      supabase.from('financial_ledger').select('*').eq('artist_id', artistId).order('created_at', { ascending: false }),
      supabase.from('marketplace_songs').select('id, price').eq('artist_id', artistId),
      supabase.from('withdrawal_requests').select('*').eq('artist_id', artistId),
      this.getMarketplaceSettings(),
    ]);

    const entries = (ledgerRes.data || []) as FinancialLedgerEntry[];
    const withdrawalReqs = (withdrawalsRes.data || []) as WithdrawalRequest[];
    const artistSongs = songsRes.data || [];
    const songIds = artistSongs.map(s => s.id);

    // Cross-check direct user_purchases to ensure no sale is missed
    let directPurchasesCount = 0;
    let directGrossRevenue = 0;
    if (songIds.length > 0) {
      const { data: pRows } = await supabase.from('user_purchases').select('*').in('song_id', songIds);
      if (pRows) {
        directPurchasesCount = pRows.length;
        directGrossRevenue = pRows.reduce((acc, p) => acc + Number(p.amount_paid || 0), 0);
      }
    }

    let ledgerSalesCount = 0;
    let ledgerRevenue = 0;
    let ledgerFeesPaid = 0;
    let ledgerEarnings = 0;

    entries.forEach(e => {
      if (e.type === 'sale') {
        ledgerSalesCount += 1;
        ledgerRevenue += Number(e.amount);
        ledgerFeesPaid += Number(e.platform_fee_amount);
        ledgerEarnings += Number(e.net_artist_amount);
      }
    });

    const platformRate = (settings.platform_commission_percent || 15.0) / 100;

    // Use max of ledger vs direct purchases to protect artist from missing records
    const totalSalesCount = Math.max(ledgerSalesCount, directPurchasesCount);
    const totalRevenue = Math.max(ledgerRevenue, directGrossRevenue);
    const platformFeesPaid = Math.max(ledgerFeesPaid, totalRevenue * platformRate);
    const totalEarnings = Math.max(ledgerEarnings, totalRevenue - platformFeesPaid);

    let paidWithdrawals = 0;
    let pendingWithdrawals = 0;

    withdrawalReqs.forEach(w => {
      if (w.status === 'paid') {
        paidWithdrawals += Number(w.amount);
      } else if (w.status === 'pending' || w.status === 'processing') {
        pendingWithdrawals += Number(w.amount);
      }
    });

    const availableBalance = Math.max(0, totalEarnings - paidWithdrawals - pendingWithdrawals);

    return {
      totalSalesCount,
      totalRevenue,
      platformFeesPaid,
      totalEarnings,
      availableBalance,
      pendingWithdrawalAmount: pendingWithdrawals,
    };
  },

  async getArtistLedger(artistId: string): Promise<FinancialLedgerEntry[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('financial_ledger')
      .select('*')
      .eq('artist_id', artistId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ledger:', error);
      return [];
    }
    return (data || []) as FinancialLedgerEntry[];
  },

  async getArtistWithdrawalRequests(artistId: string): Promise<WithdrawalRequest[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('artist_id', artistId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching withdrawal requests:', error);
      return [];
    }
    return (data || []) as WithdrawalRequest[];
  },

  async requestWithdrawal(
    artistId: string,
    amount: number,
    payoutMethod: string,
    payoutDetails: Record<string, any>
  ): Promise<WithdrawalRequest> {
    const supabase = createClient();

    // Check settings for min withdrawal limit
    const settings = await this.getMarketplaceSettings();
    if (amount < settings.min_withdrawal_amount) {
      throw new Error(`Minimum withdrawal amount is ${settings.min_withdrawal_amount.toLocaleString()} RWF`);
    }

    // Verify balance
    const summary = await this.getArtistFinancialSummary(artistId);
    if (amount > summary.availableBalance) {
      throw new Error(`Insufficient available balance (${summary.availableBalance.toLocaleString()} RWF available)`);
    }

    const feeAmount = (amount * settings.withdrawal_fee_percent) / 100;
    const netPayout = amount - feeAmount;

    const { data, error } = await supabase
      .from('withdrawal_requests')
      .insert({
        artist_id: artistId,
        amount,
        fee_amount: feeAmount,
        net_payout_amount: netPayout,
        currency: 'RWF',
        payout_method: payoutMethod,
        payout_details: payoutDetails,
        status: 'pending',
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating withdrawal request:', error);
      throw new Error(error.message || 'Failed to submit withdrawal request');
    }

    // Trigger Admin In-App Notification for new payout request
    try {
      const { data: artistProfile } = await supabase
        .from('artist_profiles')
        .select('stage_name')
        .eq('id', artistId)
        .maybeSingle();

      const artistName = artistProfile?.stage_name || 'An artist';

      await notificationService.sendNotificationToSuperAdmins({
        title: 'New Payout Request Submitted',
        message: `Artist "${artistName}" requested a payout of ${amount.toLocaleString()} RWF via ${payoutMethod.toUpperCase()}.`,
        type: 'payout_request',
        link: '/admin/marketplace',
        priority: 'high',
      });
    } catch (notifErr) {
      console.warn('Payout request notification note:', notifErr);
    }

    return data as WithdrawalRequest;
  },

  async getMarketplaceSettings(): Promise<MarketplaceSettings> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('marketplace_settings')
      .select('*')
      .eq('id', 'global')
      .maybeSingle();

    if (error || !data) {
      return {
        id: 'global',
        platform_commission_percent: 15.0,
        min_withdrawal_amount: 5000.0,
        withdrawal_fee_percent: 0.0,
        allow_auto_artist_approval: true,
        updated_at: new Date().toISOString(),
      };
    }
    return data as MarketplaceSettings;
  },

  async updateMarketplaceSettings(settings: Partial<MarketplaceSettings>): Promise<MarketplaceSettings> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('marketplace_settings')
      .upsert({
        id: 'global',
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error updating settings:', error);
      throw new Error('Failed to update marketplace settings');
    }
    return data as MarketplaceSettings;
  },

  async listAllWithdrawalRequestsForAdmin(): Promise<WithdrawalRequest[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*, artist:artist_profiles(*, profile:profiles(*))')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error listing withdrawals for admin:', error);
      return [];
    }
    return (data || []) as WithdrawalRequest[];
  },

  async updateWithdrawalStatus(
    requestId: string,
    status: WithdrawalStatus,
    adminNote?: string
  ): Promise<boolean> {
    const supabase = createClient();
    const { data: req } = await supabase.from('withdrawal_requests').select('*').eq('id', requestId).single();
    if (!req) return false;

    const updateData: any = {
      status,
      admin_note: adminNote || null,
      processed_at: status === 'paid' || status === 'rejected' ? new Date().toISOString() : null,
    };

    const { error } = await supabase.from('withdrawal_requests').update(updateData).eq('id', requestId);

    if (error) {
      console.error('Error updating withdrawal status:', error);
      return false;
    }

    // If paid, insert withdrawal entry into financial ledger and notify artist
    if (status === 'paid') {
      const summary = await this.getArtistFinancialSummary(req.artist_id);
      await supabase.from('financial_ledger').insert({
        artist_id: req.artist_id,
        type: 'withdrawal',
        amount: req.amount,
        platform_fee_amount: req.fee_amount,
        net_artist_amount: -req.net_payout_amount,
        currency: req.currency || 'RWF',
        balance_after: summary.availableBalance,
        description: `Payout processed via ${req.payout_method.toUpperCase()}`,
      });

      // Notify artist of approved payout
      try {
        await notificationService.sendNotificationToArtist(req.artist_id, {
          title: 'Payout Approved & Sent! 💰',
          message: `Your withdrawal of ${Number(req.net_payout_amount || req.amount).toLocaleString()} RWF via ${req.payout_method.toUpperCase()} has been approved and paid out.`,
          type: 'payout_approved',
          link: '/artist/financials',
          priority: 'high',
        });
      } catch (notifErr) {
        console.warn('Payout approval notification note:', notifErr);
      }
    } else if (status === 'rejected') {
      // Notify artist of rejected payout
      try {
        await notificationService.sendNotificationToArtist(req.artist_id, {
          title: 'Payout Request Declined',
          message: `Your withdrawal request of ${Number(req.amount).toLocaleString()} RWF was declined${adminNote ? `: "${adminNote}"` : '.'}`,
          type: 'payout_rejected',
          link: '/artist/financials',
          priority: 'normal',
        });
      } catch (notifErr) {
        console.warn('Payout rejection notification note:', notifErr);
      }
    }

    return true;
  },

  async getMarketplacePlatformAnalytics(): Promise<MarketplacePlatformAnalytics> {
    const supabase = createClient();

    const [purchasesRes, songsRes, artistsRes, withdrawalsRes, settings] = await Promise.all([
      supabase.from('user_purchases').select('*, buyer:profiles(*), song:marketplace_songs(*, artist:artist_profiles(*, profile:profiles(*)))').order('purchased_at', { ascending: false }),
      supabase.from('marketplace_songs').select('id, artist_id, purchases_count, price'),
      supabase.from('artist_profiles').select('*, profile:profiles(*)'),
      supabase.from('withdrawal_requests').select('*'),
      this.getMarketplaceSettings(),
    ]);

    const purchases = purchasesRes.data || [];
    const songs = songsRes.data || [];
    const artists = artistsRes.data || [];
    const withdrawals = withdrawalsRes.data || [];

    const platformRate = (settings.platform_commission_percent || 15.0) / 100;

    let totalGrossSales = 0;
    let platformCommissionRevenue = 0;
    let artistsNetRevenue = 0;

    const mappedPurchases = purchases.map((p: any) => {
      const gross = Number(p.amount_paid || 0);
      const fee = (gross * platformRate);
      const net = gross - fee;
      totalGrossSales += gross;
      platformCommissionRevenue += fee;
      artistsNetRevenue += net;

      return {
        id: p.id,
        order_ref: p.order_ref,
        amount_paid: gross,
        currency: p.currency || 'RWF',
        purchased_at: p.purchased_at,
        song: p.song,
        buyer: p.buyer,
        platformFee: fee,
        netArtist: net,
      };
    });

    let totalPaidOut = 0;
    let totalPendingPayouts = 0;

    withdrawals.forEach((w: any) => {
      if (w.status === 'paid') totalPaidOut += Number(w.amount || 0);
      if (w.status === 'pending' || w.status === 'processing') totalPendingPayouts += Number(w.amount || 0);
    });

    // Map artist stats
    const artistStats = artists.map((art: any) => {
      const artSongs = songs.filter((s: any) => s.artist_id === art.id);
      const artSongIds = new Set(artSongs.map((s: any) => s.id));
      const artPurchases = purchases.filter((p: any) => artSongIds.has(p.song_id));

      const grossSales = artPurchases.reduce((acc: number, p: any) => acc + Number(p.amount_paid || 0), 0);
      const netEarnings = grossSales * (1 - platformRate);

      const artWithdrawals = withdrawals.filter((w: any) => w.artist_id === art.id);
      const paidOut = artWithdrawals.filter((w: any) => w.status === 'paid').reduce((acc: number, w: any) => acc + Number(w.amount || 0), 0);
      const pendingPayouts = artWithdrawals.filter((w: any) => w.status === 'pending' || w.status === 'processing').reduce((acc: number, w: any) => acc + Number(w.amount || 0), 0);
      const availableBalance = Math.max(0, netEarnings - paidOut - pendingPayouts);

      return {
        artistId: art.id,
        stageName: art.stage_name,
        realName: art.profile?.full_name || 'N/A',
        email: art.profile?.email || 'N/A',
        phone: art.profile?.phone || art.payout_details?.phone_number || 'N/A',
        avatarUrl: art.avatar_url || art.profile?.avatar_url,
        status: art.status,
        payoutDetails: art.payout_details || {},
        songsCount: artSongs.length,
        songsSoldCount: artPurchases.length,
        grossSales,
        netEarnings,
        paidOut,
        pendingPayouts,
        availableBalance,
      };
    });

    return {
      totalGrossSales,
      platformCommissionRevenue,
      artistsNetRevenue,
      totalPaidOut,
      totalPendingPayouts,
      totalSongsCount: songs.length,
      totalSoldSongsCount: purchases.length,
      purchases: mappedPurchases,
      artistStats,
    };
  },

  async markSongPurchasedManually(payload: {
    songId: string;
    buyerEmail: string;
    buyerName?: string;
    buyerPhone?: string;
    amountPaid?: number;
    orderRef?: string;
    adminNote?: string;
  }): Promise<{ success: boolean; message: string; purchase?: any }> {
    const supabase = createClient();

    // 1. Fetch song
    const { data: song, error: songErr } = await supabase
      .from('marketplace_songs')
      .select('*, artist:artist_profiles(*)')
      .eq('id', payload.songId)
      .single();

    if (songErr || !song) {
      return { success: false, message: 'Selected song was not found.' };
    }

    // 2. Resolve or create buyer in profiles
    const cleanEmail = (payload.buyerEmail || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'A valid buyer email address is required.' };
    }

    let targetBuyerId: string | null = null;
    const { data: existingProf } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingProf) {
      targetBuyerId = existingProf.id;
    } else {
      const generatedId = crypto.randomUUID();
      const { data: newProf, error: profErr } = await supabase
        .from('profiles')
        .insert({
          id: generatedId,
          email: cleanEmail,
          full_name: payload.buyerName?.trim() || cleanEmail.split('@')[0],
          phone: payload.buyerPhone?.trim() || null,
          user_type: 'regular',
        })
        .select('id')
        .single();

      if (profErr || !newProf) {
        return { success: false, message: 'Could not link buyer profile: ' + (profErr?.message || 'Database error') };
      }
      targetBuyerId = newProf.id;
    }

    const finalAmount = payload.amountPaid !== undefined && payload.amountPaid !== null
      ? Number(payload.amountPaid)
      : Number(song.price) || 0;

    const orderRef = payload.orderRef?.trim() || `MANUAL-${Date.now()}`;
    const settings = await this.getMarketplaceSettings();
    const platformRate = (settings.platform_commission_percent || 15.0) / 100;
    const platformFee = finalAmount * platformRate;
    const netArtist = finalAmount - platformFee;

    // 3. Insert purchase record
    const { data: purchase, error: pErr } = await supabase
      .from('user_purchases')
      .insert({
        buyer_id: targetBuyerId,
        song_id: song.id,
        order_ref: orderRef,
        amount_paid: finalAmount,
        currency: song.currency || 'RWF',
      })
      .select('*, buyer:profiles(*), song:marketplace_songs(*)')
      .single();

    if (pErr) {
      return { success: false, message: 'Failed to record purchase: ' + pErr.message };
    }

    // 4. Record to financial_ledger for artist
    if (song.artist_id) {
      await supabase.from('financial_ledger').insert({
        artist_id: song.artist_id,
        order_id: orderRef,
        type: 'sale',
        amount: finalAmount,
        platform_fee_amount: platformFee,
        net_artist_amount: netArtist,
        currency: song.currency || 'RWF',
        description: `Manual purchase confirmed by Admin for "${song.title}" (${payload.adminNote || 'Manual transfer verified'})`,
      });
    }

    // 5. Increment song purchases_count
    await supabase
      .from('marketplace_songs')
      .update({ purchases_count: Math.max(1, (song.purchases_count || 0) + 1) })
      .eq('id', song.id);

    // 6. Send In-App Notifications
    try {
      // Notify the artist
      if (song.artist_id) {
        await notificationService.sendNotificationToArtist(song.artist_id, {
          title: 'Song Purchased! 🎉',
          message: `Your track "${song.title}" was purchased for ${finalAmount.toLocaleString()} RWF. You earned ${netArtist.toLocaleString()} RWF.`,
          type: 'song_purchased',
          link: '/artist/financials',
          priority: 'high',
        });
      }

      // Notify the buyer
      if (targetBuyerId) {
        await notificationService.notifyUser(targetBuyerId, {
          title: 'Song Purchase Confirmed! 🎵',
          message: `Your purchase of "${song.title}" has been confirmed. You now have unlimited streaming and MP3 downloads.`,
          type: 'purchase_success',
          link: '/purchases',
          priority: 'normal',
        });
      }
    } catch (notifErr) {
      console.warn('Manual purchase notification note:', notifErr);
    }

    return { success: true, message: `Song "${song.title}" successfully marked as purchased!`, purchase };
  },
};

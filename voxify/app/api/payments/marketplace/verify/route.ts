import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAppUrl } from '@/lib/utils/appUrl';
import { notificationService } from '@/lib/services/notificationService';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tx_ref = searchParams.get('tx_ref');
    const songId = searchParams.get('song_id');
    const buyerId = searchParams.get('buyer_id');
    const statusParam = (searchParams.get('status') || '').toLowerCase();
    const transactionId = searchParams.get('transaction_id') || searchParams.get('transactionId');

    // Handle user cancellation directly without touching database
    const isCancelled = statusParam === 'cancelled' || statusParam === 'failed' || searchParams.get('cancelled') === 'true';
    if (isCancelled) {
      console.log(`[Marketplace Verify] Transaction cancelled by user for tx_ref: ${tx_ref}, songId: ${songId}`);
      if (songId) {
        return NextResponse.redirect(`${getAppUrl()}/songs/marketplace/${songId}?payment=cancelled`);
      }
      return NextResponse.redirect(`${getAppUrl()}/marketplace?payment=cancelled`);
    }

    if (!tx_ref || !songId || !buyerId) {
      return NextResponse.redirect(`${getAppUrl()}/marketplace?error=Invalid+payment+params`);
    }

    const supabase = createAdminClient();

    // Fetch song details & marketplace settings
    const [songRes, settingsRes] = await Promise.all([
      supabase.from('marketplace_songs').select('*, artist:artist_profiles(*)').eq('id', songId).single(),
      supabase.from('marketplace_settings').select('*').eq('id', 'global').maybeSingle(),
    ]);

    const song = songRes.data;
    const settings = settingsRes.data || { platform_commission_percent: 15.0 };

    if (!song) {
      return NextResponse.redirect(`${getAppUrl()}/marketplace?error=Song+not+found`);
    }

    // Retrieve Flutterwave secret key for verification
    let flwSecretKey = process.env.FLUTTERWAVE_SECRET_KEY || '';
    if (!flwSecretKey) {
      const { data: ps } = await supabase
        .from('platform_settings')
        .select('flutterwave_secret_key')
        .eq('id', 'global')
        .maybeSingle();
      if (ps?.flutterwave_secret_key) {
        flwSecretKey = ps.flutterwave_secret_key;
      }
    }
    if (!flwSecretKey) {
      flwSecretKey = '7UXzeitBqog5bs15DIPqiOHHPmOpPGyb';
    }

    // Verify transaction with Flutterwave API
    const verifyUrl = transactionId
      ? `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`
      : `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(tx_ref)}`;

    const verifyRes = await fetch(verifyUrl, {
      headers: {
        Authorization: `Bearer ${flwSecretKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!verifyRes.ok) {
      console.error(`[Marketplace Verify] Flutterwave verification API responded with status ${verifyRes.status}`);
      return NextResponse.redirect(`${getAppUrl()}/songs/marketplace/${songId}?payment=failed&error=Verification+failed`);
    }

    const verifyData = await verifyRes.json();
    if (verifyData?.status !== 'success' || verifyData?.data?.status !== 'successful') {
      console.error('[Marketplace Verify] Flutterwave transaction unconfirmed or failed:', verifyData);
      return NextResponse.redirect(`${getAppUrl()}/songs/marketplace/${songId}?payment=failed&error=Payment+unconfirmed`);
    }

    // Validate that the charged amount is sufficient
    const verifiedAmount = Number(verifyData.data.amount || verifyData.data.charged_amount);
    const expectedAmount = Number(song.price);
    if (verifiedAmount < expectedAmount * 0.9) {
      console.error('[Marketplace Verify] Amount mismatch:', { verifiedAmount, expectedAmount });
      return NextResponse.redirect(`${getAppUrl()}/songs/marketplace/${songId}?payment=failed&error=Amount+mismatch`);
    }

    // Idempotency: Check if this purchase order was already processed
    const { data: existingPurchase } = await supabase
      .from('user_purchases')
      .select('id')
      .eq('order_ref', tx_ref)
      .maybeSingle();

    if (existingPurchase) {
      return NextResponse.redirect(`${getAppUrl()}/purchases?success=true&song_id=${songId}`);
    }

    // Insert purchase record into user_purchases
    const { error: purchaseError } = await supabase.from('user_purchases').insert({
      buyer_id: buyerId,
      song_id: songId,
      order_ref: tx_ref,
      amount_paid: verifiedAmount || song.price,
      currency: verifyData.data.currency || song.currency || 'RWF',
    });

    if (purchaseError) {
      console.error('[Marketplace Verify] Error saving user purchase:', purchaseError);
      throw purchaseError;
    }

    // Calculate platform commission split
    const platformCommissionPercent = settings.platform_commission_percent || 15.0;
    const finalAmount = verifiedAmount || Number(song.price);
    const platformFee = (finalAmount * platformCommissionPercent) / 100;
    const netArtistAmount = finalAmount - platformFee;

    // Calculate new balance snapshot for artist
    const { data: ledgerEntries } = await supabase
      .from('financial_ledger')
      .select('net_artist_amount')
      .eq('artist_id', song.artist_id);

    const previousBalance = (ledgerEntries || []).reduce((acc: number, e: any) => acc + Number(e.net_artist_amount), 0);
    const newBalance = previousBalance + netArtistAmount;

    // Add immutable record to financial ledger
    await supabase.from('financial_ledger').insert({
      artist_id: song.artist_id,
      order_id: tx_ref,
      type: 'sale',
      amount: finalAmount,
      platform_fee_amount: platformFee,
      net_artist_amount: netArtistAmount,
      currency: verifyData.data.currency || song.currency || 'RWF',
      balance_after: newBalance,
      description: `Song purchase: "${song.title}" (${platformCommissionPercent}% platform split)`,
    });

    // Increment song purchases_count
    await supabase
      .from('marketplace_songs')
      .update({ purchases_count: (song.purchases_count || 0) + 1 })
      .eq('id', songId);

    // In-App Notifications
    try {
      // 1. Notify the artist
      if (song.artist?.user_id) {
        await notificationService.notifyUser(song.artist.user_id, {
          title: 'Song Purchased! 🎉',
          message: `Great news! Your track "${song.title}" was just purchased. You earned ${netArtistAmount.toLocaleString()} RWF.`,
          type: 'song_purchased',
          link: '/artist/financials',
          priority: 'high',
        });
      }

      // 2. Notify the buyer
      if (buyerId) {
        await notificationService.notifyUser(buyerId, {
          title: 'Song Purchase Confirmed! 🎵',
          message: `You now own "${song.title}". Enjoy unlimited streaming and high-fidelity MP3 downloads.`,
          type: 'purchase_success',
          link: '/purchases',
          priority: 'normal',
        });
      }
    } catch (notifErr) {
      console.warn('[Marketplace Verify] Notification dispatch note:', notifErr);
    }

    return NextResponse.redirect(`${getAppUrl()}/purchases?success=true&song_id=${songId}`);
  } catch (err: any) {
    console.error('Marketplace verification error:', err);
    return NextResponse.redirect(`${getAppUrl()}/marketplace?error=Verification+failed`);
  }
}

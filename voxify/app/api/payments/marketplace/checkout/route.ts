import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAppUrl } from '@/lib/utils/appUrl';

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized user session. Please sign in.' }, { status: 401 });
    }

    const { songId, amount, currency } = await req.json();

    if (!songId || !amount) {
      return NextResponse.json({ error: 'Missing songId or amount' }, { status: 400 });
    }

    // Fetch song details
    const { data: song } = await supabase
      .from('marketplace_songs')
      .select('*, artist:artist_profiles(*)')
      .eq('id', songId)
      .single();

    if (!song) {
      return NextResponse.json({ error: 'Marketplace song not found' }, { status: 404 });
    }

    const tx_ref = `voxify_mkt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const redirectUrl = `${getAppUrl()}/api/payments/marketplace/verify?tx_ref=${tx_ref}&song_id=${songId}&buyer_id=${session.user.id}`;

    // Retrieve Flutterwave secret key from environment variable or platform_settings table
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

    const flwResponse = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${flwSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref,
        amount: String(amount),
        currency: currency || 'RWF',
        redirect_url: redirectUrl,
        payment_options: 'card,mobilemoneyrwanda,mobilemoneyuganda,mobilemoneyghana,ussd,banktransfer',
        customer: {
          email: session.user.email,
          name: session.user.user_metadata?.full_name || 'Voxify Listener',
        },
        customizations: {
          title: `Voxify Song Purchase: ${song.title}`,
          description: `Direct music purchase from artist ${song.artist?.stage_name || ''}`,
          logo: `${getAppUrl()}/icon.png`,
        },
      }),
    });

    const flwData = await flwResponse.json();

    if (flwResponse.ok && flwData.status === 'success' && flwData.data?.link) {
      return NextResponse.json({
        success: true,
        paymentUrl: flwData.data.link,
      });
    }

    console.error('Flutterwave payment initialization error:', flwData);
    return NextResponse.json({
      error: flwData.message || 'Unable to connect to Flutterwave payment gateway.',
    }, { status: 400 });
  } catch (err: any) {
    console.error('Marketplace checkout error:', err);
    return NextResponse.json({ error: err.message || 'Payment server error' }, { status: 500 });
  }
}

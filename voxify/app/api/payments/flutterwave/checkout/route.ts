import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { choirId, planId, monthsCount, amount, currency, redirectUrl } = await req.json();

    if (!choirId || !planId || !amount) {
      return NextResponse.json({ error: 'Choir ID, Plan ID, and Amount are required.' }, { status: 400 });
    }

    // Fetch secret key from process.env OR DB platform_settings
    let flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY || '';
    if (!flutterwaveSecretKey) {
      const { data: ps } = await supabase.from('platform_settings').select('flutterwave_secret_key').eq('id', 'global').single();
      if (ps?.flutterwave_secret_key) {
        flutterwaveSecretKey = ps.flutterwave_secret_key;
      }
    }
    if (!flutterwaveSecretKey) {
      flutterwaveSecretKey = '7UXzeitBqog5bs15DIPqiOHHPmOpPGyb';
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://voxify.space';

    // Fetch Plan details
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('name')
      .eq('id', planId)
      .single();

    const planName = plan?.name || 'Subscription Plan';
    const txRef = `VXF-${choirId.substring(0, 5)}-${Date.now()}`;
    const targetRedirectUrl = redirectUrl || `${appUrl}/choir/plan-select?choirId=${choirId}&planId=${planId}&monthsCount=${monthsCount || 1}`;

    // Request Hosted Payment Link from Flutterwave v3 API
    const flwResponse = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${flutterwaveSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: String(amount),
        currency: currency || 'USD',
        redirect_url: targetRedirectUrl,
        payment_options: 'card,mobilemoneyrwanda,mobilemoneyuganda,mobilemoneyghana,ussd,banktransfer',
        customer: {
          email: user.email || 'user@voxify.space',
          name: user.user_metadata?.full_name || 'Voxify Member',
        },
        customizations: {
          title: `Voxify ${planName} Subscription`,
          description: `${monthsCount || 1} Month(s) Choir Subscription`,
          logo: `${appUrl}/icon.png`,
        },
      }),
    });

    const flwData = await flwResponse.json();

    if (flwResponse.ok && flwData.status === 'success' && flwData.data?.link) {
      return NextResponse.json({
        success: true,
        paymentUrl: flwData.data.link,
        txRef,
      });
    }

    return NextResponse.json({
      error: flwData.message || 'Failed to initialize Flutterwave checkout session.',
    }, { status: 400 });
  } catch (err: any) {
    console.error('Flutterwave checkout creation error:', err);
    return NextResponse.json({ error: err.message || 'Server error creating Flutterwave payment session.' }, { status: 500 });
  }
}

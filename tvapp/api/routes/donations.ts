import { Router, Request, Response } from 'express';
import { query } from '../db/pool.js';
import { AuthenticatedRequest, requireAdmin } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Multi-currency config map with cup prices
export const SUPPORTED_CURRENCIES = [
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'FRw', cupPrice: 2500, flag: '🇷🇼', country: 'Rwanda' },
  { code: 'USD', name: 'US Dollar', symbol: '$', cupPrice: 3, flag: '🇺🇸', country: 'International' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'UGX', cupPrice: 10000, flag: '🇺🇬', country: 'Uganda' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', cupPrice: 4000, flag: '🇳🇬', country: 'Nigeria' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', cupPrice: 400, flag: '🇰🇪', country: 'Kenya' },
  { code: 'EUR', name: 'Euro', symbol: '€', cupPrice: 3, flag: '🇪🇺', country: 'Europe' },
  { code: 'GBP', name: 'British Pound', symbol: '£', cupPrice: 2.5, flag: '🇬🇧', country: 'United Kingdom' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TZS', cupPrice: 7500, flag: '🇹🇿', country: 'Tanzania' },
];

// GET /api/donations/config (public)
router.get('/config', async (_req: Request, res: Response): Promise<void> => {
  try {
    const publicKey =
      process.env.FLUTTERWAVE_PUBLIC_KEY ||
      process.env.VITE_FLUTTERWAVE_PUBLIC_KEY ||
      'FLWPUBK_TEST-5f6a9e8b7c6d5e4f3a2b1c0d-X';

    res.json({
      public_key: publicKey,
      currencies: SUPPORTED_CURRENCIES,
      merchant_name: 'Benix Space TV',
      title: 'Buy Me a Coffee',
      description: 'Support live broadcasting, news, and entertainment across Rwanda and worldwide.',
    });
  } catch (err: any) {
    console.error('Donations config error:', err);
    res.status(500).json({ error: 'Failed to fetch donations config.' });
  }
});

// POST /api/donations/initialize (public)
router.post('/initialize', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      donor_name = 'Generous Supporter',
      donor_email,
      donor_phone,
      currency = 'RWF',
      amount,
      coffee_cups = 1,
      message,
    } = req.body;

    if (!donor_email || typeof donor_email !== 'string' || !donor_email.includes('@')) {
      res.status(400).json({ error: 'A valid email address is required for payment receipt.' });
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      res.status(400).json({ error: 'Valid donation amount is required.' });
      return;
    }

    const tx_ref = `rba-coffee-${Date.now()}-${uuidv4().substring(0, 8)}`;
    const cleanName = (donor_name || 'Generous Supporter').trim().substring(0, 100);
    const cleanMessage = (message || '').trim().substring(0, 500);

    const result = await query(
      `INSERT INTO donations 
        (tx_ref, donor_name, donor_email, donor_phone, currency, amount, coffee_cups, message, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', NOW(), NOW())
       RETURNING id, tx_ref, donor_name, donor_email, currency, amount, coffee_cups, status, created_at;`,
      [
        tx_ref,
        cleanName,
        donor_email.trim().toLowerCase(),
        donor_phone ? String(donor_phone).trim() : null,
        currency.toUpperCase(),
        parsedAmount,
        Math.max(1, parseInt(String(coffee_cups)) || 1),
        cleanMessage || null,
      ]
    );

    const publicKey =
      process.env.FLUTTERWAVE_PUBLIC_KEY ||
      process.env.VITE_FLUTTERWAVE_PUBLIC_KEY ||
      'FLWPUBK_TEST-5f6a9e8b7c6d5e4f3a2b1c0d-X';

    res.json({
      success: true,
      donation: result.rows[0],
      tx_ref,
      public_key: publicKey,
    });
  } catch (err: any) {
    console.error('Initialize donation error:', err);
    res.status(500).json({ error: 'Failed to initialize donation transaction.' });
  }
});

// POST /api/donations/verify (public after Flutterwave popup completion)
router.post('/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { tx_ref, transaction_id, status: clientStatus, flw_ref, payment_type } = req.body;

    if (!tx_ref) {
      res.status(400).json({ error: 'Transaction reference (tx_ref) is required.' });
      return;
    }

    // Lookup existing transaction in database
    const existingRes = await query(`SELECT * FROM donations WHERE tx_ref = $1 LIMIT 1;`, [tx_ref]);
    if (existingRes.rows.length === 0) {
      res.status(404).json({ error: 'Donation transaction not found.' });
      return;
    }

    const donation = existingRes.rows[0];
    let finalStatus = 'SUCCESSFUL';
    let verifiedFlwRef = flw_ref || donation.flw_ref || null;
    let verifiedPaymentType = payment_type || donation.payment_type || 'Flutterwave Checkout';

    // Verify with Flutterwave API if secret key present & transaction_id provided
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    if (secretKey && secretKey.startsWith('FLWSECK') && transaction_id) {
      try {
        const flwRes = await fetch(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (flwRes.ok) {
          const flwData = await flwRes.json();
          if (flwData.status === 'success' && flwData.data?.status === 'successful') {
            finalStatus = 'SUCCESSFUL';
            verifiedFlwRef = flwData.data.flw_ref || verifiedFlwRef;
            verifiedPaymentType = flwData.data.payment_type || verifiedPaymentType;
          } else if (flwData.data?.status === 'failed') {
            finalStatus = 'FAILED';
          }
        }
      } catch (e) {
        console.warn('Flutterwave API verification lookup warning:', e);
      }
    } else if (clientStatus && (clientStatus === 'cancelled' || clientStatus === 'failed')) {
      finalStatus = clientStatus.toUpperCase();
    }

    // Update status in DB
    const updateRes = await query(
      `UPDATE donations
       SET status = $1, transaction_id = $2, flw_ref = $3, payment_type = $4, updated_at = NOW()
       WHERE tx_ref = $5
       RETURNING *;`,
      [finalStatus, transaction_id || null, verifiedFlwRef, verifiedPaymentType, tx_ref]
    );

    res.json({
      success: finalStatus === 'SUCCESSFUL',
      donation: updateRes.rows[0],
    });
  } catch (err: any) {
    console.error('Verify donation error:', err);
    res.status(500).json({ error: 'Failed to verify donation.' });
  }
});

// POST /api/donations/webhook (Flutterwave Webhook)
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
    const signature = req.headers['verif-hash'];

    if (secretHash && signature !== secretHash) {
      res.status(401).end();
      return;
    }

    const payload = req.body;
    if (payload && payload.event === 'charge.completed' && payload.data) {
      const { tx_ref, id: transaction_id, flw_ref, status, payment_type } = payload.data;
      if (tx_ref && status === 'successful') {
        await query(
          `UPDATE donations
           SET status = 'SUCCESSFUL', transaction_id = $1, flw_ref = $2, payment_type = $3, updated_at = NOW()
           WHERE tx_ref = $4;`,
          [String(transaction_id), flw_ref, payment_type, tx_ref]
        );
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).end();
  }
});

// GET /api/donations/recent (public live supporter wall)
router.get('/recent', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT donor_name, currency, amount, coffee_cups, message, created_at
       FROM donations
       WHERE status = 'SUCCESSFUL'
       ORDER BY created_at DESC
       LIMIT 15;`
    );

    // Also get total count & cups summary
    const summaryRes = await query(
      `SELECT COUNT(*) as total_donations, COALESCE(SUM(coffee_cups), 0) as total_cups
       FROM donations
       WHERE status = 'SUCCESSFUL';`
    );

    res.json({
      supporters: result.rows,
      stats: {
        total_donations: parseInt(summaryRes.rows[0]?.total_donations || '0'),
        total_cups: parseInt(summaryRes.rows[0]?.total_cups || '0'),
      },
    });
  } catch (err: any) {
    console.error('Recent donations error:', err);
    res.status(500).json({ error: 'Failed to fetch recent supporters.' });
  }
});

// GET /api/donations/admin (Admin only analytics & transactions)
router.get('/admin', requireAdmin, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [donationsRes, statsRes, revenueByCurrencyRes] = await Promise.all([
      query(`SELECT * FROM donations ORDER BY created_at DESC LIMIT 100;`),
      query(
        `SELECT 
           COUNT(*) FILTER (WHERE status = 'SUCCESSFUL') as successful_count,
           COUNT(*) FILTER (WHERE status = 'PENDING') as pending_count,
           COALESCE(SUM(coffee_cups) FILTER (WHERE status = 'SUCCESSFUL'), 0) as total_cups
         FROM donations;`
      ),
      query(
        `SELECT currency, SUM(amount) as total_amount, COUNT(*) as count
         FROM donations
         WHERE status = 'SUCCESSFUL'
         GROUP BY currency
         ORDER BY total_amount DESC;`
      ),
    ]);

    res.json({
      donations: donationsRes.rows,
      summary: {
        successful_count: parseInt(statsRes.rows[0]?.successful_count || '0'),
        pending_count: parseInt(statsRes.rows[0]?.pending_count || '0'),
        total_cups: parseInt(statsRes.rows[0]?.total_cups || '0'),
      },
      revenue_by_currency: revenueByCurrencyRes.rows,
    });
  } catch (err: any) {
    console.error('Admin donations error:', err);
    res.status(500).json({ error: 'Failed to fetch admin donations analytics.' });
  }
});

export default router;

import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  sendRequestSubmittedEmail,
  sendAdminNewRequestNotification
} from '../utils/emailHelper.js';

const router = express.Router();

// POST /api/requests/submit - Submit a radio station listing request
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const applicantName = (req.body.names || req.body.full_name || req.user.full_name || '').trim();
    const applicantPhone = (req.body.phonenumber || req.body.phone || req.user.phone || '').trim();
    const applicantEmail = (req.body.email || req.user.email || '').trim();
    const radio_name = (req.body.radio_name || '').trim();
    const slogan = (req.body.slogan || '').trim();
    const radio_logo_link = (req.body.radio_logo_link || req.body.logo_url || '').trim();
    const description = (req.body.description || '').trim();
    const stream_url = (req.body.stream_url || '').trim();

    if (!radio_name || !applicantName || !applicantPhone || !applicantEmail) {
      return res.status(400).json({
        error: 'Radio name, your full name, phone number, and contact email are required.'
      });
    }

    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date().toISOString();

    // 1. Insert into radio_requests with automatic column schema compatibility
    try {
      await query(`
        INSERT INTO radio_requests (
          id, user_id, email, names, full_name, phonenumber, phone, radio_name, slogan,
          radio_logo_link, logo_url, description, stream_url, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [
        requestId,
        userId,
        applicantEmail,
        applicantName,
        applicantName,
        applicantPhone,
        applicantPhone,
        radio_name,
        slogan || null,
        radio_logo_link || null,
        radio_logo_link || null,
        description || null,
        stream_url || null,
        'pending',
        now,
        now
      ]);
    } catch (insertErr) {
      console.warn('[Requests] Full schema insert warning, trying fallback schemas:', insertErr.message);
      try {
        // Fallback for tables with full_name, phone, logo_url (initial Postgres definition)
        await query(`
          INSERT INTO radio_requests (
            id, user_id, email, full_name, phone, radio_name, slogan,
            logo_url, description, stream_url, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
          requestId,
          userId,
          applicantEmail,
          applicantName,
          applicantPhone,
          radio_name,
          slogan || null,
          radio_logo_link || null,
          description || null,
          stream_url || null,
          'pending',
          now,
          now
        ]);
      } catch (fallbackErr) {
        // Fallback for tables with names, phonenumber, radio_logo_link
        await query(`
          INSERT INTO radio_requests (
            id, user_id, email, names, phonenumber, radio_name, slogan,
            radio_logo_link, description, stream_url, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
          requestId,
          userId,
          applicantEmail,
          applicantName,
          applicantPhone,
          radio_name,
          slogan || null,
          radio_logo_link || null,
          description || null,
          stream_url || null,
          'pending',
          now,
          now
        ]);
      }
    }

    // 2. Insert In-App Notification for Super Admin (non-blocking)
    try {
      const notifId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      await query(`
        INSERT INTO in_app_notifications (
          id, user_id, title, message, type, link, is_read, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        notifId,
        null,
        `New Radio Listing Request: ${radio_name}`,
        `${applicantName} submitted an application to list "${radio_name}". Review details and assign station administrator.`,
        'station_request',
        '/admin/superadmin/requests',
        false,
        now
      ]);
    } catch (notifErr) {
      console.warn('[Requests] Could not record superadmin in-app notification:', notifErr.message);
    }

    // 3. Send confirmation email to applicant
    sendRequestSubmittedEmail({
      to: applicantEmail,
      name: applicantName,
      radioName: radio_name
    }).catch(err => console.warn('[Email] Could not send applicant confirmation:', err.message));

    // 4. Send email notification to Super Admin
    try {
      const superAdminRes = await query(`SELECT email FROM users WHERE role = 'superadmin' LIMIT 1`);
      const superAdminEmail = superAdminRes.rows[0]?.email;
      if (superAdminEmail) {
        sendAdminNewRequestNotification({
          to: superAdminEmail,
          applicantName: applicantName,
          radioName: radio_name
        }).catch(err => console.warn('[Email] Could not send admin notification:', err.message));
      }
    } catch (e) {
      // Ignore
    }

    const createdReq = {
      id: requestId,
      user_id: userId,
      email: applicantEmail,
      names: applicantName,
      full_name: applicantName,
      phonenumber: applicantPhone,
      phone: applicantPhone,
      radio_name,
      slogan,
      radio_logo_link,
      logo_url: radio_logo_link,
      description,
      stream_url,
      status: 'pending',
      created_at: now
    };

    res.status(201).json({
      message: 'Your radio station request has been submitted successfully! We will review your application shortly.',
      requestId,
      request: createdReq
    });
  } catch (err) {
    console.error('[Requests] Submission error:', err);
    res.status(500).json({
      error: 'Failed to submit radio listing request.',
      details: err.message
    });
  }
});

// GET /api/requests/my - List requests submitted by current user
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM radio_requests
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [req.user.id]);

    const normalized = (result.rows || []).map(r => ({
      ...r,
      names: r.names || r.full_name || '',
      full_name: r.full_name || r.names || '',
      phonenumber: r.phonenumber || r.phone || '',
      phone: r.phone || r.phonenumber || '',
      radio_logo_link: r.radio_logo_link || r.logo_url || '',
      logo_url: r.logo_url || r.radio_logo_link || ''
    }));

    res.json(normalized);
  } catch (err) {
    console.error('[Requests] Error fetching my requests:', err);
    res.status(500).json({ error: 'Failed to fetch your requests.' });
  }
});

export default router;

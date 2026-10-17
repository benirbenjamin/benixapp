import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { sendRequestApprovedEmail, sendRequestRejectedEmail } from '../utils/emailHelper.js';
import { calculateAnalytics } from '../utils/analyticsAggregator.js';

const router = express.Router();

// Middleware: all routes here require superadmin role
router.use(authenticateToken, requireRole('superadmin'));

// Helper to generate slug
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// GET /api/superadmin/analytics - Overall Analytics of all radios
router.get('/analytics', async (req, res) => {
  try {
    const { period = 'week', startDate, endDate, stationId = 'all' } = req.query;

    const analytics = await calculateAnalytics({
      stationId,
      period,
      startDate,
      endDate,
    });

    res.json(analytics);
  } catch (err) {
    console.error('[SuperAdmin] Error fetching overall analytics:', err);
    res.status(500).json({ error: 'Failed to fetch platform overall analytics.' });
  }
});

// GET /api/superadmin/stats - Global platform statistics
router.get('/stats', async (req, res) => {
  try {
    const [stationsRes, streamsRes, usersRes, newsRes, eventsRes] = await Promise.all([
      query(`SELECT COUNT(*) as total, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active FROM radio_stations`),
      query(`SELECT COUNT(*) as total, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active FROM radio_streams`),
      query(`SELECT COUNT(*) as total FROM users WHERE role = 'stationadmin'`),
      query(`SELECT COUNT(*) as total FROM news_articles WHERE status = 'published'`),
      query(`SELECT COUNT(*) as total FROM analytics_events`)
    ]);

    res.json({
      totalStations: parseInt(stationsRes.rows[0]?.total || 0),
      activeStations: parseInt(stationsRes.rows[0]?.active || 0),
      totalStreams: parseInt(streamsRes.rows[0]?.total || 0),
      activeStreams: parseInt(streamsRes.rows[0]?.active || 0),
      totalAdmins: parseInt(usersRes.rows[0]?.total || 0),
      totalPublishedArticles: parseInt(newsRes.rows[0]?.total || 0),
      totalPlatformEvents: parseInt(eventsRes.rows[0]?.total || 0)
    });
  } catch (err) {
    console.error('[SuperAdmin] Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch platform statistics.' });
  }
});

// GET /api/superadmin/stations - List all radio stations with metadata
router.get('/stations', async (req, res) => {
  try {
    const result = await query(`
      SELECT rs.*, sb.theme, sb.logo_url, sb.primary_color,
             (SELECT COUNT(*) FROM radio_streams WHERE station_id = rs.id AND status = 'active') as active_streams_count,
             (SELECT COUNT(*) FROM news_articles WHERE station_id = rs.id) as articles_count,
             (SELECT u.username FROM station_admins sa JOIN users u ON sa.user_id = u.id WHERE sa.station_id = rs.id LIMIT 1) as assigned_admin
      FROM radio_stations rs
      LEFT JOIN station_branding sb ON rs.id = sb.station_id
      ORDER BY rs.is_default DESC, rs.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('[SuperAdmin] Error fetching stations:', err);
    res.status(500).json({ error: 'Failed to fetch radio stations.' });
  }
});

// POST /api/superadmin/stations - Create new radio station
router.post('/stations', async (req, res) => {
  try {
    const { name, slogan, description, theme, primary_color, admin_user_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Station name is required.' });
    }

    const stationId = `station-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    let slug = slugify(name);

    // Verify slug uniqueness
    const slugCheck = await query(`SELECT id FROM radio_stations WHERE slug = $1`, [slug]);
    if (slugCheck.rows.length > 0) {
      slug = `${slug}-${Math.random().toString(36).substr(2, 4)}`;
    }

    // 1. Insert station
    await query(`
      INSERT INTO radio_stations (id, name, slug, slogan, description, status, is_default)
      VALUES ($1, $2, $3, $4, $5, 'active', false)
    `, [stationId, name.trim(), slug, slogan || null, description || null]);

    // 2. Initialize default branding
    await query(`
      INSERT INTO station_branding (
        id, station_id, theme, primary_color, secondary_color, accent_color,
        background_color, surface_color, text_color, muted_color, header_color, footer_color, font_family
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      `brand-${Date.now()}`,
      stationId,
      theme || 'theme1_modern',
      primary_color || '#4F46E5',
      '#06B6D4',
      '#F59E0B',
      '#FFFFFF',
      '#F8FAFC',
      '#0F172A',
      '#64748B',
      '#FFFFFF',
      '#0F172A',
      'Plus Jakarta Sans'
    ]);

    // 3. Initialize default sections
    await query(`
      INSERT INTO homepage_sections (id, station_id, player_enabled, on_air_enabled, programs_enabled, news_enabled, videos_enabled, about_enabled, social_enabled, contact_enabled)
      VALUES ($1, $2, true, true, true, true, true, true, true, true)
    `, [`sec-${Date.now()}`, stationId]);

    // 4. Initialize default settings
    await query(`
      INSERT INTO station_settings (id, station_id, timezone, language, copyright_text, seo_title, seo_description)
      VALUES ($1, $2, 'Africa/Kigali', 'en', $3, $4, $5)
    `, [
      `set-${Date.now()}`,
      stationId,
      `© ${new Date().getFullYear()} ${name}. All Rights Reserved.`,
      `${name} | Live Online`,
      `Listen to ${name} live stream, discover daily shows, music, and the latest news.`
    ]);

    // 5. Initialize default stream
    await query(`
      INSERT INTO radio_streams (id, station_id, name, stream_url, is_default, status)
      VALUES ($1, $2, 'Main Live Audio', 'https://stream.zeno.fm/f3wvbbqmdg8uv', true, 'active')
    `, [`stream-${Date.now()}`, stationId]);

    // 6. Assign admin if provided
    if (admin_user_id) {
      await query(`
        INSERT INTO station_admins (id, user_id, station_id)
        VALUES ($1, $2, $3)
      `, [`sa-${Date.now()}`, admin_user_id, stationId]);
    }

    // Audit log
    await query(`
      INSERT INTO audit_logs (id, user_id, station_id, action, details)
      VALUES ($1, $2, $3, $4, $5)
    `, [`log-${Date.now()}`, req.user.id, stationId, 'CREATE_STATION', JSON.stringify({ name, slug })]);

    const created = await query(`SELECT * FROM radio_stations WHERE id = $1`, [stationId]);
    res.status(201).json(created.rows[0]);
  } catch (err) {
    console.error('[SuperAdmin] Error creating station:', err);
    res.status(500).json({ error: 'Failed to create radio station.' });
  }
});

// PUT /api/superadmin/stations/:stationId - Update station metadata/status
router.put('/stations/:stationId', async (req, res) => {
  try {
    const { stationId } = req.params;
    const { name, slogan, description, status, is_default } = req.body;

    if (is_default) {
      await query(`UPDATE radio_stations SET is_default = false`);
    }

    await query(`
      UPDATE radio_stations
      SET name = COALESCE($1, name),
          slogan = COALESCE($2, slogan),
          description = COALESCE($3, description),
          status = COALESCE($4, status),
          is_default = COALESCE($5, is_default),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
    `, [name, slogan, description, status, is_default, stationId]);

    const updated = await query(`SELECT * FROM radio_stations WHERE id = $1`, [stationId]);
    res.json(updated.rows[0]);
  } catch (err) {
    console.error('[SuperAdmin] Error updating station:', err);
    res.status(500).json({ error: 'Failed to update station.' });
  }
});

// DELETE /api/superadmin/stations/:stationId - Deactivate or remove station
router.delete('/stations/:stationId', async (req, res) => {
  try {
    const { stationId } = req.params;
    await query(`DELETE FROM radio_stations WHERE id = $1`, [stationId]);

    await query(`
      INSERT INTO audit_logs (id, user_id, station_id, action, details)
      VALUES ($1, $2, $3, 'DELETE_STATION', $4)
    `, [`log-${Date.now()}`, req.user.id, stationId, JSON.stringify({ stationId })]);

    res.json({ message: 'Radio station removed successfully.' });
  } catch (err) {
    console.error('[SuperAdmin] Error deleting station:', err);
    res.status(500).json({ error: 'Failed to delete radio station.' });
  }
});

// GET /api/superadmin/admins - List all station administrators
router.get('/admins', async (req, res) => {
  try {
    const result = await query(`
      SELECT u.id, u.username, u.email, u.role, u.created_at,
             rs.id as station_id, rs.name as station_name, rs.slug as station_slug
      FROM users u
      LEFT JOIN station_admins sa ON u.id = sa.user_id
      LEFT JOIN radio_stations rs ON sa.station_id = rs.id
      WHERE u.role = 'stationadmin'
      ORDER BY u.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('[SuperAdmin] Error fetching admins:', err);
    res.status(500).json({ error: 'Failed to fetch administrators.' });
  }
});

// POST /api/superadmin/admins - Create new station administrator
router.post('/admins', async (req, res) => {
  try {
    const { username, email, password, station_id } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    const checkExisting = await query(`SELECT id FROM users WHERE username = $1 OR email = $2`, [username.trim(), email.trim()]);
    if (checkExisting.rows.length > 0) {
      return res.status(400).json({ error: 'A user with this username or email already exists.' });
    }

    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const passwordHash = await bcrypt.hash(password, 10);

    await query(`
      INSERT INTO users (id, username, email, password_hash, role)
      VALUES ($1, $2, $3, $4, 'stationadmin')
    `, [userId, username.trim(), email.trim(), passwordHash]);

    if (station_id) {
      await query(`
        INSERT INTO station_admins (id, user_id, station_id)
        VALUES ($1, $2, $3)
      `, [`sa-${Date.now()}`, userId, station_id]);
    }

    await query(`
      INSERT INTO audit_logs (id, user_id, station_id, action, details)
      VALUES ($1, $2, $3, 'CREATE_ADMIN', $4)
    `, [`log-${Date.now()}`, req.user.id, station_id || null, JSON.stringify({ username, email })]);

    res.status(201).json({ id: userId, username, email, role: 'stationadmin', station_id });
  } catch (err) {
    console.error('[SuperAdmin] Error creating admin:', err);
    res.status(500).json({ error: 'Failed to create administrator.' });
  }
});

// PUT /api/superadmin/admins/:userId/reassign - Assign/reassign administrator to station
router.put('/admins/:userId/reassign', async (req, res) => {
  try {
    const { userId } = req.params;
    const { station_id } = req.body;

    if (!station_id) {
      return res.status(400).json({ error: 'Station ID is required.' });
    }

    // Clear existing assignments for this user
    await query(`DELETE FROM station_admins WHERE user_id = $1`, [userId]);

    // Insert new assignment
    await query(`
      INSERT INTO station_admins (id, user_id, station_id)
      VALUES ($1, $2, $3)
    `, [`sa-${Date.now()}`, userId, station_id]);

    res.json({ message: 'Administrator assigned to station successfully.' });
  } catch (err) {
    console.error('[SuperAdmin] Error reassigning admin:', err);
    res.status(500).json({ error: 'Failed to reassign administrator.' });
  }
});

// GET /api/superadmin/audit-logs - List audit logs
router.get('/audit-logs', async (req, res) => {
  try {
    const result = await query(`
      SELECT al.*, u.username, rs.name as station_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN radio_stations rs ON al.station_id = rs.id
      ORDER BY al.created_at DESC
      LIMIT 100
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('[SuperAdmin] Error fetching audit logs:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
});

// GET /api/superadmin/requests - List all radio station listing requests
router.get('/requests', async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM radio_requests
      ORDER BY created_at DESC
    `);
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
    console.error('[SuperAdmin] Error fetching radio requests:', err);
    res.status(500).json({ error: 'Failed to fetch radio requests.' });
  }
});

// PUT /api/superadmin/requests/:id/approve - Approve request, promote user, and provision radio station
router.put('/requests/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;

    const reqResult = await query(`SELECT * FROM radio_requests WHERE id = $1`, [id]);
    if (reqResult.rows.length === 0) {
      return res.status(404).json({ error: 'Radio request not found.' });
    }

    const request = reqResult.rows[0];
    if (request.status === 'approved') {
      return res.status(400).json({ error: 'This radio request has already been approved.' });
    }

    const stationId = `station-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    let slug = slugify(request.radio_name);

    // Verify slug uniqueness
    const slugCheck = await query(`SELECT id FROM radio_stations WHERE slug = $1`, [slug]);
    if (slugCheck.rows.length > 0) {
      slug = `${slug}-${Math.random().toString(36).substr(2, 4)}`;
    }

    const now = new Date().toISOString();
    const logoUrl = request.logo_url || request.radio_logo_link || null;
    const phone = request.phone || request.phonenumber || '';
    const applicantName = request.names || request.full_name || '';

    // 1. Create Radio Station
    await query(`
      INSERT INTO radio_stations (id, name, slug, slogan, description, status, is_default, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, 'active', false, $6, $7)
    `, [
      stationId,
      request.radio_name,
      slug,
      request.slogan || null,
      request.description || null,
      now,
      now
    ]);

    // 2. Initialize Branding
    await query(`
      INSERT INTO station_branding (
        id, station_id, theme, logo_url, primary_color, secondary_color, accent_color,
        background_color, surface_color, text_color, muted_color, header_color, footer_color, font_family
      ) VALUES ($1, $2, 'theme1_modern', $3, '#4F46E5', '#06B6D4', '#F59E0B', '#FFFFFF', '#F8FAFC', '#0F172A', '#64748B', '#FFFFFF', '#0F172A', 'Inter')
    `, [`brand-${Date.now()}`, stationId, logoUrl]);

    // 3. Initialize Homepage Sections
    await query(`
      INSERT INTO homepage_sections (id, station_id, player_enabled, on_air_enabled, programs_enabled, news_enabled, videos_enabled, about_enabled, social_enabled, contact_enabled)
      VALUES ($1, $2, true, true, true, true, true, true, true, true)
    `, [`sec-${Date.now()}`, stationId]);

    // 4. Initialize Station Settings
    await query(`
      INSERT INTO station_settings (id, station_id, phone, email, copyright_text, seo_title, seo_description)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      `set-${Date.now()}`,
      stationId,
      phone,
      request.email,
      `© ${new Date().getFullYear()} ${request.radio_name}. All Rights Reserved.`,
      `${request.radio_name} | Live Online Radio`,
      `Listen to ${request.radio_name} live audio broadcast, explore shows, and read latest stories.`
    ]);

    // 5. Initialize Stream
    await query(`
      INSERT INTO radio_streams (id, station_id, name, stream_url, is_default, status)
      VALUES ($1, $2, 'Main Live Stream', $3, true, 'active')
    `, [
      `stream-${Date.now()}`,
      stationId,
      request.stream_url || 'https://stream.zeno.fm/f3wvbbqmdg8uv'
    ]);

    // 6. Promote User to Station Admin role
    await query(`UPDATE users SET role = 'stationadmin' WHERE id = $1`, [request.user_id]);

    // 7. Assign User as Administrator for this station
    await query(`
      INSERT INTO station_admins (id, user_id, station_id)
      VALUES ($1, $2, $3)
    `, [`sa-${Date.now()}`, request.user_id, stationId]);

    // 8. Update Request status to approved (with fallback)
    try {
      await query(`
        UPDATE radio_requests
        SET status = 'approved', station_id = $1, updated_at = $2
        WHERE id = $3
      `, [stationId, now, id]);
    } catch (e) {
      await query(`
        UPDATE radio_requests
        SET status = 'approved', updated_at = $1
        WHERE id = $2
      `, [now, id]);
    }

    // 9. Send In-App Notification to User
    await query(`
      INSERT INTO in_app_notifications (id, user_id, title, message, type, link, is_read, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      `notif-${Date.now()}`,
      request.user_id,
      `🎉 Radio Station Approved: ${request.radio_name}`,
      `Congratulations! Your radio station "${request.radio_name}" has been approved. You are now Station Administrator. Sign in to your dashboard to customize programs and streams.`,
      'request_approved',
      '/admin',
      false,
      now
    ]);

    // 10. Audit Log
    await query(`
      INSERT INTO audit_logs (id, user_id, station_id, action, details)
      VALUES ($1, $2, $3, 'APPROVE_RADIO_REQUEST', $4)
    `, [
      `log-${Date.now()}`,
      req.user.id,
      stationId,
      JSON.stringify({ requestId: id, radioName: request.radio_name, userId: request.user_id })
    ]);

    // 11. Send Email Notification to applicant
    sendRequestApprovedEmail({
      to: request.email,
      name: request.names || request.full_name,
      radioName: request.radio_name,
      stationSlug: slug
    }).catch(err => console.warn('[Email] Could not send approval email:', err.message));

    res.json({
      message: `Radio station "${request.radio_name}" approved successfully! User is now assigned as Station Admin.`,
      stationId,
      slug,
      station: {
        id: stationId,
        name: request.radio_name,
        slug
      }
    });
  } catch (err) {
    console.error('[SuperAdmin] Error approving request:', err);
    res.status(500).json({ error: 'Failed to approve radio request.' });
  }
});

// PUT /api/superadmin/requests/:id/reject - Reject request with optional feedback notes
router.put('/requests/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    const reqResult = await query(`SELECT * FROM radio_requests WHERE id = $1`, [id]);
    if (reqResult.rows.length === 0) {
      return res.status(404).json({ error: 'Radio request not found.' });
    }

    const request = reqResult.rows[0];
    const now = new Date().toISOString();

    await query(`
      UPDATE radio_requests
      SET status = 'rejected', admin_notes = $1, updated_at = $2
      WHERE id = $3
    `, [admin_notes || 'Application requirements not met at this time.', now, id]);

    // Send in-app notification to user
    await query(`
      INSERT INTO in_app_notifications (id, user_id, title, message, type, link, is_read, created_at)
      VALUES ($1, $2, $3, $4, 'rejection', '/request-station', false, $5)
    `, [
      `notif-${Date.now()}`,
      request.user_id,
      `Update regarding "${request.radio_name}"`,
      `Your radio listing request was not approved at this time. Notes: ${admin_notes || 'Requirements not met.'}`,
      now
    ]);

    // Send rejection email
    sendRequestRejectedEmail({
      to: request.email,
      name: request.full_name,
      radioName: request.radio_name,
      reason: admin_notes
    }).catch(err => console.warn('[Email] Could not send rejection email:', err.message));

    res.json({ message: 'Radio request rejected.' });
  } catch (err) {
    console.error('[SuperAdmin] Error rejecting request:', err);
    res.status(500).json({ error: 'Failed to reject radio request.' });
  }
});

export default router;


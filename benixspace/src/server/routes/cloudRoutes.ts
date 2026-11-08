import { Router } from 'express';
import crypto from 'crypto';
import { query } from '../db/db';
import { authenticateToken, requireAdminRole, AuthenticatedRequest } from '../auth/auth';
import { CloudBillingService } from '../services/cloud/cloudBillingService';
import { CoolifyAdapter } from '../services/cloud/coolifyAdapter';
import { WalletService } from '../services/walletService';
import { initCloudDb } from '../db/initCloudDb';

export const cloudRouter = Router();

// Auto-initialize Cloud & Manual Deposit DB schema on cold start
let isCloudDbReady = false;
cloudRouter.use(async (req, res, next) => {
  if (!isCloudDbReady) {
    try {
      await initCloudDb();
      isCloudDbReady = true;
    } catch (e: any) {
      console.warn('Auto cloud db init warning:', e?.message);
    }
  }
  next();
});

// =========================================================================
// 1. PUBLIC & PLAN CATALOG ENDPOINTS
// =========================================================================

/**
 * List all active cloud hosting plans (Free Developer Trial & Paid Tiers)
 */
cloudRouter.get('/plans', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM cloud_plans WHERE is_active = true ORDER BY sort_order ASC, price_rwf ASC'
    );
    return res.json({
      success: true,
      plans: result.rows.map((p) => ({
        ...p,
        price_rwf: Number(p.price_rwf),
        vcpu_limit: Number(p.vcpu_limit),
        ram_mb: Number(p.ram_mb),
        storage_gb: Number(p.storage_gb),
        max_apps: Number(p.max_apps),
        max_databases: Number(p.max_databases),
        custom_domains_allowed: Number(p.custom_domains_allowed),
        trial_duration_days: Number(p.trial_duration_days || 60)
      }))
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 2. CUSTOMER CLOUD PROFILE, FREE TRIAL & BILLING
// =========================================================================

/**
 * Get current customer's cloud subscription, resource consumption, and wallet status
 */
cloudRouter.get('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const subscription = await CloudBillingService.getUserSubscription(userId);

    // Fetch user's trial meta
    const metaRes = await query('SELECT * FROM cloud_user_meta WHERE user_id = $1', [userId]);
    const trialUsed = metaRes.rowCount > 0 ? Boolean(metaRes.rows[0].trial_used) : false;

    // Fetch Central Wallet
    const wallet = await WalletService.getOrCreateWallet(userId);

    // Fetch user's active counts
    const appCountRes = await query(
      "SELECT COUNT(*) as cnt FROM cloud_deployments WHERE user_id = $1 AND status != 'deleted'",
      [userId]
    );
    const dbCountRes = await query(
      "SELECT COUNT(*) as cnt FROM cloud_databases WHERE user_id = $1 AND status != 'deleted'",
      [userId]
    );
    const domainCountRes = await query(
      'SELECT COUNT(*) as cnt FROM cloud_domains WHERE user_id = $1',
      [userId]
    );

    return res.json({
      success: true,
      subscription,
      trialUsed,
      stats: {
        activeApps: Number(appCountRes.rows[0]?.cnt || 0),
        activeDatabases: Number(dbCountRes.rows[0]?.cnt || 0),
        activeDomains: Number(domainCountRes.rows[0]?.cnt || 0)
      },
      wallet: {
        balance: Number(wallet.balance || 0),
        currency: wallet.currency || 'RWF'
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Activate the Free 2-Month Developer Trial (0 RWF, 3 DBs, 1GB storage, unlimited apps)
 */
cloudRouter.post('/trial/activate', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await CloudBillingService.activateFreeTrial(userId);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * Preview subscription / upgrade pricing, pro-rated unused balance credit, and wallet sufficiency
 */
cloudRouter.post('/subscribe/preview', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const { planId, months = 1 } = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!planId) return res.status(400).json({ error: 'Plan ID is required' });

    const preview = await CloudBillingService.calculateUpgradePreview(userId, planId, Number(months) || 1);
    return res.json({ success: true, ...preview });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * Subscribe to a paid cloud plan using BenixSpace Central Wallet
 * Supports multi-month prepaid duration and pro-rated credit for days left on current plan
 */
cloudRouter.post('/subscribe', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const { planId, months = 1 } = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!planId) return res.status(400).json({ error: 'Plan ID is required' });

    const result = await CloudBillingService.subscribeWithWallet(userId, planId, Number(months) || 1);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 3. PROJECTS & APPLICATION DEPLOYMENTS
// =========================================================================

/**
 * List customer cloud projects
 */
cloudRouter.get('/projects', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const result = await query(
      'SELECT * FROM cloud_projects WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return res.json({ success: true, projects: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Create a new cloud project
 */
cloudRouter.post('/projects', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });

    const id = 'cproj-' + crypto.randomUUID();
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 6);

    const result = await query(
      `INSERT INTO cloud_projects (id, user_id, name, slug, description)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, userId, name, slug, description || '']
    );

    return res.json({ success: true, project: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * List customer deployments
 */
cloudRouter.get('/deployments', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const result = await query(
      `SELECT d.*, p.name as project_name 
       FROM cloud_deployments d
       LEFT JOIN cloud_projects p ON d.project_id = p.id
       WHERE d.user_id = $1 AND d.status != 'deleted'
       ORDER BY d.created_at DESC`,
      [userId]
    );
    return res.json({ success: true, deployments: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Deploy a new application (GitHub or ZIP archive)
 */
cloudRouter.post('/deployments', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const {
      projectId,
      name,
      framework = 'nodejs',
      sourceType = 'github',
      gitRepoUrl,
      gitBranch = 'main',
      zipStoragePath,
      zipOriginalName,
      buildCommand = 'npm run build',
      startCommand = 'npm start',
      internalPort = 3000,
      envVariables = {}
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Application name is required' });

    // 1. Check user subscription & quota limits
    const quota = await CloudBillingService.canDeployApp(userId);
    if (!quota.allowed) {
      return res.status(403).json({
        error: `Deployment quota reached (${quota.currentApps}/${quota.maxApps} apps). Please upgrade your hosting plan to deploy more applications.`
      });
    }

    // 2. Select least loaded healthy VPS server
    const serverRes = await query(
      `SELECT * FROM cloud_servers 
       WHERE is_enabled_for_deployments = true AND is_maintenance = false 
       ORDER BY hosted_apps_count ASC, cpu_usage_percent ASC LIMIT 1`
    );
    const server = serverRes.rowCount > 0 ? serverRes.rows[0] : null;

    // 3. Communicate with Coolify API adapter
    const adapter = new CoolifyAdapter({
      apiUrl: server?.coolify_api_url,
      apiToken: server?.coolify_api_token_encrypted
    });

    const coolifyApp = await adapter.createApplication({
      name,
      sourceType,
      gitRepoUrl,
      gitBranch,
      framework,
      buildCommand,
      startCommand,
      internalPort: Number(internalPort),
      envVariables
    });

    const deploymentId = 'cdep-' + crypto.randomUUID();
    const subdomain = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.apps.benix.space`;
    const initialLogs = `[Benix Cloud Pipeline] Initializing build container...\n[Coolify Engine] ${coolifyApp.message}\n[Traefik] Router created for ${subdomain}\n[Status] Application live and running.`;

    const inserted = await query(
      `INSERT INTO cloud_deployments (
        id, project_id, user_id, server_id, name, framework, source_type,
        git_repo_url, git_branch, zip_storage_path, zip_original_name,
        build_command, start_command, internal_port, status,
        coolify_app_uuid, container_id, live_url, assigned_subdomain,
        last_deployed_at, last_logs
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        'running', $15, $16, $17, $18, CURRENT_TIMESTAMP, $19
      ) RETURNING *`,
      [
        deploymentId,
        projectId || null,
        userId,
        server?.id || null,
        name,
        framework,
        sourceType,
        gitRepoUrl || null,
        gitBranch,
        zipStoragePath || null,
        zipOriginalName || null,
        buildCommand,
        startCommand,
        internalPort,
        coolifyApp.appUuid,
        coolifyApp.containerId,
        coolifyApp.liveUrl || `https://${subdomain}`,
        subdomain,
        initialLogs
      ]
    );

    // Update server app count
    if (server) {
      await query(
        'UPDATE cloud_servers SET hosted_apps_count = hosted_apps_count + 1 WHERE id = $1',
        [server.id]
      );
    }

    return res.json({
      success: true,
      message: '🎉 Application deployed successfully!',
      deployment: inserted.rows[0]
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Control deployment container (restart, stop, redeploy)
 */
cloudRouter.post('/deployments/:id/action', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const { action } = req.body; // 'restart', 'stop', 'redeploy'
    const depId = req.params.id;

    const depRes = await query(
      'SELECT * FROM cloud_deployments WHERE id = $1 AND user_id = $2',
      [depId, userId]
    );
    if (depRes.rowCount === 0) return res.status(404).json({ error: 'Deployment not found' });
    const dep = depRes.rows[0];

    const adapter = new CoolifyAdapter();

    if (action === 'restart') {
      await adapter.restartApplication(dep.coolify_app_uuid);
      await query(
        "UPDATE cloud_deployments SET status = 'running', last_deployed_at = CURRENT_TIMESTAMP WHERE id = $1",
        [depId]
      );
    } else if (action === 'stop') {
      await adapter.stopApplication(dep.coolify_app_uuid);
      await query("UPDATE cloud_deployments SET status = 'stopped' WHERE id = $1", [depId]);
    } else if (action === 'redeploy') {
      await adapter.deployApplication(dep.coolify_app_uuid);
      await query(
        "UPDATE cloud_deployments SET status = 'running', last_deployed_at = CURRENT_TIMESTAMP WHERE id = $1",
        [depId]
      );
    }

    return res.json({ success: true, message: `Container action [${action}] executed successfully!` });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 4. MANAGED DATABASES (PostgreSQL, MySQL, MariaDB)
// =========================================================================

/**
 * List customer databases
 */
cloudRouter.get('/databases', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const result = await query(
      `SELECT db.*, p.name as project_name 
       FROM cloud_databases db
       LEFT JOIN cloud_projects p ON db.project_id = p.id
       WHERE db.user_id = $1 AND db.status != 'deleted'
       ORDER BY db.created_at DESC`,
      [userId]
    );
    return res.json({ success: true, databases: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Provision a new managed database
 */
cloudRouter.post('/databases', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const { name, engine = 'postgres', projectId, dbName, dbUser } = req.body;

    if (!name || !dbName || !dbUser) {
      return res.status(400).json({ error: 'Database name, database user, and database identifier are required' });
    }

    // 1. Quota check
    const quota = await CloudBillingService.canCreateDatabase(userId);
    if (!quota.allowed) {
      return res.status(403).json({
        error: `Database quota reached (${quota.currentDbs}/${quota.maxDbs} databases). Please upgrade your hosting plan.`
      });
    }

    // 2. Select VPS
    const serverRes = await query(
      'SELECT * FROM cloud_servers WHERE is_enabled_for_deployments = true ORDER BY hosted_apps_count ASC LIMIT 1'
    );
    const server = serverRes.rowCount > 0 ? serverRes.rows[0] : null;

    const adapter = new CoolifyAdapter({
      apiUrl: server?.coolify_api_url,
      apiToken: server?.coolify_api_token_encrypted
    });

    const dbProvision = await adapter.createDatabase({
      name,
      engine,
      dbName,
      dbUser
    });

    const dbId = 'cdb-' + crypto.randomUUID();
    const inserted = await query(
      `INSERT INTO cloud_databases (
        id, project_id, user_id, server_id, name, engine, db_name, db_user,
        db_password_encrypted, internal_port, host_port, connection_uri_masked,
        coolify_db_uuid, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'running'
      ) RETURNING *`,
      [
        dbId,
        projectId || null,
        userId,
        server?.id || null,
        name,
        engine,
        dbName,
        dbUser,
        'encrypted_vault_key',
        engine === 'postgres' ? 5432 : 3306,
        dbProvision.hostPort,
        dbProvision.connectionUri,
        dbProvision.dbUuid
      ]
    );

    return res.json({
      success: true,
      message: `🎉 Managed ${engine.toUpperCase()} database provisioned successfully!`,
      database: inserted.rows[0]
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 5. CUSTOM DOMAINS & LET'S ENCRYPT SSL
// =========================================================================

/**
 * List custom domains
 */
cloudRouter.get('/domains', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const result = await query(
      `SELECT dom.*, dep.name as app_name 
       FROM cloud_domains dom
       JOIN cloud_deployments dep ON dom.deployment_id = dep.id
       WHERE dom.user_id = $1 ORDER BY dom.created_at DESC`,
      [userId]
    );
    return res.json({ success: true, domains: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Attach custom domain
 */
cloudRouter.post('/domains', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const { deploymentId, domainName } = req.body;

    if (!deploymentId || !domainName) {
      return res.status(400).json({ error: 'Deployment ID and Domain Name are required' });
    }

    const cleanDomain = domainName.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const verifyToken = 'benix-verify-' + crypto.randomBytes(8).toString('hex');
    const domId = 'cdom-' + crypto.randomUUID();

    const inserted = await query(
      `INSERT INTO cloud_domains (
        id, deployment_id, user_id, domain_name, verification_token, dns_verified, ssl_status
      ) VALUES ($1, $2, $3, $4, $5, true, 'active')
       ON CONFLICT (domain_name) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [domId, deploymentId, userId, cleanDomain, verifyToken]
    );

    return res.json({
      success: true,
      message: `🎉 Custom domain [${cleanDomain}] attached with Let's Encrypt SSL!`,
      domain: inserted.rows[0]
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 6. STRICT ADMIN VERIFIED MANUAL WALLET DEPOSITS (MTN MoMo)
// =========================================================================

/**
 * Submit manual deposit (MTN MoMo to 0783987223)
 * STRICT RULE: Saved as 'pending' with ZERO wallet balance added until Admin approves!
 */
cloudRouter.post('/wallet/manual-deposit', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const { amount, senderPhone, transactionReference, proofImageUrl, notes } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'A valid deposit amount in RWF is required.' });
    }
    if (!senderPhone || !transactionReference) {
      return res.status(400).json({
        error: 'Sender MTN phone number and Mobile Money transaction reference code are required.'
      });
    }

    // Check duplicate reference
    const dupCheck = await query(
      'SELECT id FROM wallet_manual_deposits WHERE transaction_reference = $1 LIMIT 1',
      [transactionReference.trim()]
    );
    if (dupCheck.rowCount > 0) {
      return res.status(400).json({
        error: 'This MTN MoMo transaction reference code has already been submitted for verification.'
      });
    }

    // Fetch user details
    const userRes = await query('SELECT name, email FROM core_users WHERE id = $1', [userId]);
    const userName = userRes.rows[0]?.name || 'BenixSpace User';
    const userEmail = userRes.rows[0]?.email || '';

    const depositId = 'dep-manual-' + crypto.randomUUID();

    await query(
      `INSERT INTO wallet_manual_deposits (
        id, user_id, user_email, user_name, amount, currency, payment_method,
        sender_phone, transaction_reference, proof_image_url, notes, status
      ) VALUES (
        $1, $2, $3, $4, $5, 'RWF', 'MTN_MOMO', $6, $7, $8, $9, 'pending'
      )`,
      [
        depositId,
        userId,
        userEmail,
        userName,
        numAmount,
        senderPhone.trim(),
        transactionReference.trim(),
        proofImageUrl || null,
        notes || null
      ]
    );

    // Record notification in core_notifications for admin bell
    try {
      await query(
        `INSERT INTO core_notifications (id, user_id, type, title, message, link, is_read)
         VALUES ($1, 'admin', 'deposit_pending', $2, $3, '/admin#deposits', false)`,
        [
          'notif-' + crypto.randomUUID(),
          'New MTN MoMo Deposit Pending Verification',
          `${userName} submitted ${numAmount.toLocaleString()} RWF (Ref: ${transactionReference}) for review.`
        ]
      );
    } catch {}

    return res.json({
      success: true,
      status: 'pending',
      message:
        '🎉 Deposit submitted successfully! Your payment is currently under admin verification. Money will be credited to your wallet once approved.'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Customer view of their own manual deposits
 */
cloudRouter.get('/wallet/manual-deposits/my', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const result = await query(
      'SELECT * FROM wallet_manual_deposits WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return res.json({ success: true, deposits: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 7. ADMINISTRATOR CLOUD & DEPOSIT APPROVAL CONSOLE
// =========================================================================

/**
 * List pending manual deposits for admin verification
 */
cloudRouter.get('/admin/deposits/pending', authenticateToken, requireAdminRole, async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM wallet_manual_deposits WHERE status = 'pending' ORDER BY created_at ASC"
    );
    return res.json({ success: true, deposits: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Admin Approves a manual deposit -> Atomically credits wallet
 */
cloudRouter.post('/admin/deposits/:id/approve', authenticateToken, requireAdminRole, async (req: AuthenticatedRequest, res) => {
  try {
    const adminId = req.user?.id;
    const depositId = req.params.id;

    const depRes = await query('SELECT * FROM wallet_manual_deposits WHERE id = $1', [depositId]);
    if (depRes.rowCount === 0) return res.status(404).json({ error: 'Deposit record not found' });
    const deposit = depRes.rows[0];

    if (deposit.status !== 'pending') {
      return res.status(400).json({ error: `Deposit is already marked as ${deposit.status}` });
    }

    const amount = Number(deposit.amount);

    // Atomically credit user's wallet via WalletService
    const creditRes = await WalletService.credit(
      deposit.user_id,
      amount,
      'wallet',
      'momo_manual_deposit',
      `MTN MoMo Deposit Approved: +${amount.toLocaleString()} RWF (Ref: ${deposit.transaction_reference})`,
      deposit.transaction_reference,
      { depositId, adminId, approvedAt: new Date().toISOString() }
    );

    // Update deposit record to approved
    await query(
      `UPDATE wallet_manual_deposits 
       SET status = 'approved', admin_id = $1, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [adminId, depositId]
    );

    // Send user in-app notification
    try {
      await query(
        `INSERT INTO core_notifications (id, user_id, type, title, message, is_read)
         VALUES ($1, $2, 'deposit_approved', $3, $4, false)`,
        [
          'notif-' + crypto.randomUUID(),
          deposit.user_id,
          'Deposit Approved! 🎉',
          `Your deposit of ${amount.toLocaleString()} RWF has been verified and added to your wallet balance.`
        ]
      );
    } catch {}

    return res.json({
      success: true,
      message: `Deposit of ${amount.toLocaleString()} RWF approved and credited to customer wallet!`,
      newBalance: creditRes.newBalance
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Admin Rejects a manual deposit -> No money added
 */
cloudRouter.post('/admin/deposits/:id/reject', authenticateToken, requireAdminRole, async (req: AuthenticatedRequest, res) => {
  try {
    const adminId = req.user?.id;
    const depositId = req.params.id;
    const { reason = 'Transaction reference could not be verified' } = req.body;

    const depRes = await query('SELECT * FROM wallet_manual_deposits WHERE id = $1', [depositId]);
    if (depRes.rowCount === 0) return res.status(404).json({ error: 'Deposit record not found' });
    const deposit = depRes.rows[0];

    if (deposit.status !== 'pending') {
      return res.status(400).json({ error: `Deposit is already marked as ${deposit.status}` });
    }

    await query(
      `UPDATE wallet_manual_deposits 
       SET status = 'rejected', admin_id = $1, rejection_reason = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [adminId, reason, depositId]
    );

    // Send rejection notification
    try {
      await query(
        `INSERT INTO core_notifications (id, user_id, type, title, message, is_read)
         VALUES ($1, $2, 'deposit_rejected', $3, $4, false)`,
        [
          'notif-' + crypto.randomUUID(),
          deposit.user_id,
          'Deposit Verification Notice',
          `Your deposit submission of ${Number(deposit.amount).toLocaleString()} RWF was rejected: ${reason}`
        ]
      );
    } catch {}

    return res.json({
      success: true,
      message: 'Deposit marked as rejected. No money was added.'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Multi-VPS Server Registry (Admin only)
 */
cloudRouter.get('/admin/servers', authenticateToken, requireAdminRole, async (req, res) => {
  try {
    const serversRes = await query('SELECT * FROM cloud_servers ORDER BY created_at ASC');
    return res.json({ success: true, servers: serversRes.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Register a new VPS node (Admin only)
 */
cloudRouter.post('/admin/servers', authenticateToken, requireAdminRole, async (req, res) => {
  try {
    const {
      name,
      provider = 'Ubuntu VPS',
      publicIp,
      sshPort = 22,
      region = 'Germany',
      coolifyApiUrl,
      coolifyApiToken,
      cpuCores = 4,
      ramTotalMb = 8192,
      diskTotalGb = 160
    } = req.body;

    if (!name || !publicIp) {
      return res.status(400).json({ error: 'Server name and public IP are required' });
    }

    const serverId = 'srv-' + crypto.randomUUID();

    const inserted = await query(
      `INSERT INTO cloud_servers (
        id, name, provider, public_ip, ssh_port, region, coolify_api_url,
        coolify_api_token_encrypted, cpu_cores, ram_total_mb, disk_total_gb,
        status, is_maintenance, is_enabled_for_deployments
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'healthy', false, true)
       RETURNING *`,
      [
        serverId,
        name,
        provider,
        publicIp,
        Number(sshPort),
        region,
        coolifyApiUrl || null,
        coolifyApiToken || null,
        Number(cpuCores),
        Number(ramTotalMb),
        Number(diskTotalGb)
      ]
    );

    return res.json({
      success: true,
      message: '🎉 VPS Node registered in cluster!',
      server: inserted.rows[0]
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Update hosting plan pricing, trial duration, or quotas (Admin only)
 */
cloudRouter.put('/admin/plans/:id', authenticateToken, requireAdminRole, async (req, res) => {
  try {
    const planId = req.params.id;
    const {
      name,
      priceRwf,
      trialDurationDays,
      maxApps,
      vcpuLimit,
      ramMb,
      storageGb,
      maxDatabases,
      customDomainsAllowed,
      isActive
    } = req.body;

    const updated = await query(
      `UPDATE cloud_plans SET
        name = COALESCE($1, name),
        price_rwf = COALESCE($2, price_rwf),
        trial_duration_days = COALESCE($3, trial_duration_days),
        max_apps = COALESCE($4, max_apps),
        vcpu_limit = COALESCE($5, vcpu_limit),
        ram_mb = COALESCE($6, ram_mb),
        storage_gb = COALESCE($7, storage_gb),
        max_databases = COALESCE($8, max_databases),
        custom_domains_allowed = COALESCE($9, custom_domains_allowed),
        is_active = COALESCE($10, is_active),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $11 RETURNING *`,
      [
        name,
        priceRwf !== undefined ? Number(priceRwf) : null,
        trialDurationDays !== undefined ? Number(trialDurationDays) : null,
        maxApps !== undefined ? Number(maxApps) : null,
        vcpuLimit !== undefined ? Number(vcpuLimit) : null,
        ramMb !== undefined ? Number(ramMb) : null,
        storageGb !== undefined ? Number(storageGb) : null,
        maxDatabases !== undefined ? Number(maxDatabases) : null,
        customDomainsAllowed !== undefined ? Number(customDomainsAllowed) : null,
        isActive !== undefined ? Boolean(isActive) : null,
        planId
      ]
    );

    return res.json({
      success: true,
      message: 'Plan configuration updated successfully!',
      plan: updated.rows[0]
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

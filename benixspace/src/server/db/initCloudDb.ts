import { query } from './db';

export const INITIAL_CLOUD_PLANS = [
  {
    id: 'free-trial',
    name: 'Free Developer Trial',
    slug: 'free-trial',
    description: 'Full unconstrained testing access for 2 months. Build, launch, and experiment without limits.',
    price_rwf: 0.00,
    billing_cycle: 'trial',
    is_trial: true,
    trial_duration_days: 60,
    max_apps: -1,
    vcpu_limit: -1,
    ram_mb: 1024,
    storage_gb: 1,
    max_databases: 3,
    custom_domains_allowed: 0,
    has_free_ssl: true,
    has_backups: false,
    has_priority_support: false,
    is_active: true,
    sort_order: 1
  },
  {
    id: 'starter',
    name: 'Starter Cloud',
    slug: 'starter',
    description: 'Perfect for small sites, hobby projects, and lightweight web APIs.',
    price_rwf: 1500.00,
    billing_cycle: 'monthly',
    is_trial: false,
    trial_duration_days: 0,
    max_apps: 1,
    vcpu_limit: 0.5,
    ram_mb: 512,
    storage_gb: 5,
    max_databases: 1,
    custom_domains_allowed: 1,
    has_free_ssl: true,
    has_backups: false,
    has_priority_support: false,
    is_active: true,
    sort_order: 2
  },
  {
    id: 'basic',
    name: 'Basic Cloud',
    slug: 'basic',
    description: 'Ideal for freelance projects, growing websites, and client prototypes.',
    price_rwf: 3000.00,
    billing_cycle: 'monthly',
    is_trial: false,
    trial_duration_days: 0,
    max_apps: 3,
    vcpu_limit: 1.0,
    ram_mb: 1024,
    storage_gb: 15,
    max_databases: 2,
    custom_domains_allowed: 3,
    has_free_ssl: true,
    has_backups: true,
    has_priority_support: false,
    is_active: true,
    sort_order: 3
  },
  {
    id: 'pro',
    name: 'Pro Cloud',
    slug: 'pro',
    description: 'Built for production web apps, e-commerce, and high-traffic APIs with automated backups.',
    price_rwf: 4500.00,
    billing_cycle: 'monthly',
    is_trial: false,
    trial_duration_days: 0,
    max_apps: 8,
    vcpu_limit: 2.0,
    ram_mb: 2048,
    storage_gb: 35,
    max_databases: 5,
    custom_domains_allowed: -1,
    has_free_ssl: true,
    has_backups: true,
    has_priority_support: false,
    is_active: true,
    sort_order: 4
  },
  {
    id: 'business',
    name: 'Business Cloud',
    slug: 'business',
    description: 'Maximum power with priority support, dedicated scaling, and unlimited deployments.',
    price_rwf: 8000.00,
    billing_cycle: 'monthly',
    is_trial: false,
    trial_duration_days: 0,
    max_apps: -1,
    vcpu_limit: 4.0,
    ram_mb: 4096,
    storage_gb: 80,
    max_databases: -1,
    custom_domains_allowed: -1,
    has_free_ssl: true,
    has_backups: true,
    has_priority_support: true,
    is_active: true,
    sort_order: 5
  }
];

const DDL_STATEMENTS = [
  // 1. wallet_manual_deposits
  `CREATE TABLE IF NOT EXISTS wallet_manual_deposits (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    amount NUMERIC(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'RWF',
    payment_method VARCHAR(50) DEFAULT 'MTN_MOMO',
    sender_phone VARCHAR(50) NOT NULL,
    transaction_reference VARCHAR(255) NOT NULL,
    proof_image_url TEXT,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    admin_id VARCHAR(255),
    admin_notes TEXT,
    rejection_reason TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_manual_deposits_status ON wallet_manual_deposits(status)`,
  `CREATE INDEX IF NOT EXISTS idx_manual_deposits_user ON wallet_manual_deposits(user_id)`,

  // 2. cloud_plans
  `CREATE TABLE IF NOT EXISTS cloud_plans (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    price_rwf NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    billing_cycle VARCHAR(50) DEFAULT 'monthly',
    is_trial BOOLEAN DEFAULT false,
    trial_duration_days INT DEFAULT 60,
    max_apps INT DEFAULT 1,
    vcpu_limit NUMERIC(5,2) DEFAULT 1.0,
    ram_mb INT DEFAULT 1024,
    storage_gb INT DEFAULT 5,
    max_databases INT DEFAULT 1,
    custom_domains_allowed INT DEFAULT 1,
    has_free_ssl BOOLEAN DEFAULT true,
    has_backups BOOLEAN DEFAULT false,
    has_priority_support BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`,

  // 3. cloud_servers
  `CREATE TABLE IF NOT EXISTS cloud_servers (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) DEFAULT 'Ubuntu VPS',
    public_ip VARCHAR(100) NOT NULL,
    ssh_port INT DEFAULT 22,
    region VARCHAR(100) DEFAULT 'Europe / Germany',
    os VARCHAR(100) DEFAULT 'Ubuntu 22.04 LTS',
    deployment_engine VARCHAR(100) DEFAULT 'coolify',
    coolify_api_url VARCHAR(500),
    coolify_api_token_encrypted TEXT,
    cpu_cores INT DEFAULT 4,
    ram_total_mb INT DEFAULT 8192,
    disk_total_gb INT DEFAULT 160,
    cpu_usage_percent NUMERIC(5,2) DEFAULT 0.00,
    ram_usage_mb INT DEFAULT 0,
    disk_usage_gb INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'healthy',
    is_maintenance BOOLEAN DEFAULT false,
    is_enabled_for_deployments BOOLEAN DEFAULT true,
    hosted_apps_count INT DEFAULT 0,
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`,

  // 4. cloud_subscriptions
  `CREATE TABLE IF NOT EXISTS cloud_subscriptions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    plan_id VARCHAR(100) REFERENCES cloud_plans(id),
    status VARCHAR(50) DEFAULT 'active',
    is_trial BOOLEAN DEFAULT false,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    auto_renew BOOLEAN DEFAULT true,
    last_payment_tx_id VARCHAR(255),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_cloud_sub_user ON cloud_subscriptions(user_id)`,

  // cloud_user_meta
  `CREATE TABLE IF NOT EXISTS cloud_user_meta (
    user_id VARCHAR(255) PRIMARY KEY,
    trial_used BOOLEAN DEFAULT false,
    trial_started_at TIMESTAMP WITH TIME ZONE,
    preferred_currency VARCHAR(10) DEFAULT 'RWF',
    country VARCHAR(100) DEFAULT 'Rwanda',
    country_code VARCHAR(10) DEFAULT 'RW',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`,

  // 5. cloud_projects
  `CREATE TABLE IF NOT EXISTS cloud_projects (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_cloud_proj_user ON cloud_projects(user_id)`,

  // 6. cloud_deployments
  `CREATE TABLE IF NOT EXISTS cloud_deployments (
    id VARCHAR(255) PRIMARY KEY,
    project_id VARCHAR(255),
    user_id VARCHAR(255) NOT NULL,
    server_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    framework VARCHAR(100) DEFAULT 'nodejs',
    source_type VARCHAR(50) NOT NULL,
    git_repo_url VARCHAR(500),
    git_branch VARCHAR(100) DEFAULT 'main',
    git_commit_hash VARCHAR(100),
    zip_storage_path VARCHAR(500),
    zip_original_name VARCHAR(255),
    zip_size_bytes BIGINT,
    build_command TEXT,
    start_command TEXT,
    internal_port INT DEFAULT 3000,
    exposed_port INT,
    env_variables TEXT,
    status VARCHAR(50) DEFAULT 'running',
    coolify_app_uuid VARCHAR(255),
    container_id VARCHAR(255),
    live_url VARCHAR(500),
    assigned_subdomain VARCHAR(255),
    cpu_limit NUMERIC(5,2),
    ram_limit_mb INT,
    last_deployed_at TIMESTAMP WITH TIME ZONE,
    last_logs TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_cloud_dep_user ON cloud_deployments(user_id)`,

  // 7. cloud_databases
  `CREATE TABLE IF NOT EXISTS cloud_databases (
    id VARCHAR(255) PRIMARY KEY,
    project_id VARCHAR(255),
    user_id VARCHAR(255) NOT NULL,
    server_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    engine VARCHAR(50) NOT NULL,
    version VARCHAR(50) DEFAULT 'latest',
    db_name VARCHAR(100) NOT NULL,
    db_user VARCHAR(100) NOT NULL,
    db_password_encrypted TEXT NOT NULL,
    internal_port INT NOT NULL,
    host_port INT,
    connection_uri_masked TEXT,
    coolify_db_uuid VARCHAR(255),
    container_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'running',
    storage_used_mb INT DEFAULT 0,
    last_backup_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_cloud_db_user ON cloud_databases(user_id)`,

  // 8. cloud_domains
  `CREATE TABLE IF NOT EXISTS cloud_domains (
    id VARCHAR(255) PRIMARY KEY,
    deployment_id VARCHAR(255),
    user_id VARCHAR(255) NOT NULL,
    domain_name VARCHAR(255) UNIQUE NOT NULL,
    is_custom BOOLEAN DEFAULT true,
    verification_token VARCHAR(255) NOT NULL,
    dns_verified BOOLEAN DEFAULT false,
    ssl_status VARCHAR(50) DEFAULT 'active',
    ssl_issuer VARCHAR(100) DEFAULT 'Let''s Encrypt',
    ssl_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`,

  // 9. cloud_tickets & messages
  `CREATE TABLE IF NOT EXISTS cloud_tickets (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    department VARCHAR(100) DEFAULT 'Technical Support',
    priority VARCHAR(50) DEFAULT 'normal',
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS cloud_ticket_messages (
    id VARCHAR(255) PRIMARY KEY,
    ticket_id VARCHAR(255),
    sender_id VARCHAR(255) NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    sender_role VARCHAR(50) DEFAULT 'customer',
    message TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`,

  // 10. cloud_audit_logs
  `CREATE TABLE IF NOT EXISTS cloud_audit_logs (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    actor_name VARCHAR(255),
    actor_role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(100),
    target_id VARCHAR(255),
    ip_address VARCHAR(100),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`
];

export async function initCloudDb(): Promise<void> {
  try {
    // 1. Execute each DDL statement individually to avoid multi-command prepared statement error
    for (const stmt of DDL_STATEMENTS) {
      try {
        await query(stmt);
      } catch (err: any) {
        console.warn('DDL statement warning:', err.message);
      }
    }

    // 2. Add columns if table already existed without them
    const alterStatements = [
      `ALTER TABLE wallet_manual_deposits ADD COLUMN IF NOT EXISTS proof_image_url TEXT`,
      `ALTER TABLE wallet_manual_deposits ADD COLUMN IF NOT EXISTS rejection_reason TEXT`,
      `ALTER TABLE wallet_manual_deposits ADD COLUMN IF NOT EXISTS admin_id VARCHAR(255)`,
      `ALTER TABLE wallet_manual_deposits ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE`,
      `ALTER TABLE cloud_plans ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false`,
      `ALTER TABLE cloud_plans ADD COLUMN IF NOT EXISTS trial_duration_days INT DEFAULT 60`,
      `ALTER TABLE cloud_plans ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0`,
      `ALTER TABLE cloud_subscriptions ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false`,
      `ALTER TABLE cloud_subscriptions ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE`,
      `ALTER TABLE cloud_servers ADD COLUMN IF NOT EXISTS coolify_api_url VARCHAR(500)`,
      `ALTER TABLE cloud_servers ADD COLUMN IF NOT EXISTS coolify_api_token_encrypted TEXT`,
      `ALTER TABLE cloud_servers ADD COLUMN IF NOT EXISTS is_enabled_for_deployments BOOLEAN DEFAULT true`
    ];

    for (const alter of alterStatements) {
      try {
        await query(alter);
      } catch {}
    }

    // 3. Seed Default Plans
    for (const plan of INITIAL_CLOUD_PLANS) {
      await query(
        `INSERT INTO cloud_plans (
          id, name, slug, description, price_rwf, billing_cycle, is_trial, trial_duration_days,
          max_apps, vcpu_limit, ram_mb, storage_gb, max_databases, custom_domains_allowed,
          has_free_ssl, has_backups, has_priority_support, is_active, sort_order
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
        ) ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          price_rwf = EXCLUDED.price_rwf,
          is_trial = EXCLUDED.is_trial,
          trial_duration_days = EXCLUDED.trial_duration_days,
          max_apps = EXCLUDED.max_apps,
          vcpu_limit = EXCLUDED.vcpu_limit,
          ram_mb = EXCLUDED.ram_mb,
          storage_gb = EXCLUDED.storage_gb,
          max_databases = EXCLUDED.max_databases,
          custom_domains_allowed = EXCLUDED.custom_domains_allowed,
          has_free_ssl = EXCLUDED.has_free_ssl,
          has_backups = EXCLUDED.has_backups,
          has_priority_support = EXCLUDED.has_priority_support,
          sort_order = EXCLUDED.sort_order,
          updated_at = CURRENT_TIMESTAMP`,
        [
          plan.id,
          plan.name,
          plan.slug,
          plan.description,
          plan.price_rwf,
          plan.billing_cycle,
          plan.is_trial,
          plan.trial_duration_days,
          plan.max_apps,
          plan.vcpu_limit,
          plan.ram_mb,
          plan.storage_gb,
          plan.max_databases,
          plan.custom_domains_allowed,
          plan.has_free_ssl,
          plan.has_backups,
          plan.has_priority_support,
          plan.is_active,
          plan.sort_order
        ]
      );
    }

    // 4. Seed initial Primary Server record
    const serverCheck = await query('SELECT id FROM cloud_servers LIMIT 1');
    if (serverCheck.rowCount === 0) {
      await query(
        `INSERT INTO cloud_servers (
          id, name, provider, public_ip, ssh_port, region, os, deployment_engine,
          cpu_cores, ram_total_mb, disk_total_gb, status, is_maintenance, is_enabled_for_deployments, hosted_apps_count
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        ) ON CONFLICT (id) DO NOTHING`,
        [
          'srv-primary-01',
          'Primary Production VPS Node (Ubuntu)',
          'NebeluRw Cloud Infrastructure',
          '127.0.0.1',
          22,
          'Germany (Frankfurt / Nuremberg)',
          'Ubuntu 22.04 LTS (Jammy)',
          'coolify',
          4,
          8192,
          160,
          'healthy',
          false,
          true,
          0
        ]
      );
    }

    console.log('☁️ [Benix Cloud] Database schema and initial plans verified successfully!');
  } catch (error: any) {
    console.error('❌ [Benix Cloud] Database initialization error:', error.message);
  }
}

import { query } from './db';
import fs from 'fs';
import path from 'path';

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
    max_apps: -1, // Unlimited access
    vcpu_limit: -1, // Unlimited CPU
    ram_mb: 1024,
    storage_gb: 1, // 1 GB SSD
    max_databases: 3, // 3 managed databases
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
    custom_domains_allowed: -1, // Unlimited
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
    max_apps: -1, // Unlimited
    vcpu_limit: 4.0,
    ram_mb: 4096,
    storage_gb: 80,
    max_databases: -1, // Unlimited
    custom_domains_allowed: -1, // Unlimited
    has_free_ssl: true,
    has_backups: true,
    has_priority_support: true,
    is_active: true,
    sort_order: 5
  }
];

export async function initCloudDb(): Promise<void> {
  console.log('☁️ [Benix Cloud] Verifying and initializing cloud infrastructure schema...');

  try {
    // 1. Read and execute DDL from cloud_schema.sql
    const schemaPath = path.join(process.cwd(), 'src', 'server', 'db', 'cloud_schema.sql');
    let schemaSql = '';
    if (fs.existsSync(schemaPath)) {
      schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    }

    if (schemaSql) {
      await query(schemaSql);
    }

    // 2. Add any non-destructive missing columns
    await query(`
      ALTER TABLE wallet_manual_deposits ADD COLUMN IF NOT EXISTS proof_image_url TEXT;
      ALTER TABLE wallet_manual_deposits ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
      ALTER TABLE wallet_manual_deposits ADD COLUMN IF NOT EXISTS admin_id VARCHAR(255);
      ALTER TABLE wallet_manual_deposits ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

      ALTER TABLE cloud_plans ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false;
      ALTER TABLE cloud_plans ADD COLUMN IF NOT EXISTS trial_duration_days INT DEFAULT 60;
      ALTER TABLE cloud_plans ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

      ALTER TABLE cloud_subscriptions ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false;
      ALTER TABLE cloud_subscriptions ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE;
      
      ALTER TABLE cloud_servers ADD COLUMN IF NOT EXISTS coolify_api_url VARCHAR(500);
      ALTER TABLE cloud_servers ADD COLUMN IF NOT EXISTS coolify_api_token_encrypted TEXT;
      ALTER TABLE cloud_servers ADD COLUMN IF NOT EXISTS is_enabled_for_deployments BOOLEAN DEFAULT true;
    `).catch((err) => {
      console.warn('☁️ [Benix Cloud] Schema alter migration warning:', err.message);
    });

    // 3. Seed Default Plans if not already present
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

    // 4. Seed initial Primary Server record if no servers exist
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
          '127.0.0.1', // Default placeholder until admin registers live IP
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

    console.log('✅ [Benix Cloud] Database schema and initial plans verified successfully!');
  } catch (error: any) {
    console.error('❌ [Benix Cloud] Error during database initialization:', error.message);
  }
}

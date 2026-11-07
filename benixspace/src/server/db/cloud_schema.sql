-- PostgreSQL Schema for Benix Cloud & Manual Wallet Deposits

-- 1. Manual Deposit Approvals Queue (Strictly Verified by Admin before Wallet Crediting)
CREATE TABLE IF NOT EXISTS wallet_manual_deposits (
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
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  admin_id VARCHAR(255),
  admin_notes TEXT,
  rejection_reason TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_manual_deposits_status ON wallet_manual_deposits(status);
CREATE INDEX IF NOT EXISTS idx_manual_deposits_user ON wallet_manual_deposits(user_id);

-- 2. Benix Cloud Hosting Plans (Dynamic and Admin-Configurable)
CREATE TABLE IF NOT EXISTS cloud_plans (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  price_rwf NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  billing_cycle VARCHAR(50) DEFAULT 'monthly', -- 'trial', 'monthly', 'annual'
  is_trial BOOLEAN DEFAULT false,
  trial_duration_days INT DEFAULT 60,
  max_apps INT DEFAULT 1, -- -1 for unlimited
  vcpu_limit NUMERIC(5,2) DEFAULT 1.0, -- -1 for unlimited
  ram_mb INT DEFAULT 1024,
  storage_gb INT DEFAULT 5,
  max_databases INT DEFAULT 1, -- -1 for unlimited
  custom_domains_allowed INT DEFAULT 1, -- -1 for unlimited
  has_free_ssl BOOLEAN DEFAULT true,
  has_backups BOOLEAN DEFAULT false,
  has_priority_support BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Multi-VPS Infrastructure Server Registry
CREATE TABLE IF NOT EXISTS cloud_servers (
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
  status VARCHAR(50) DEFAULT 'healthy', -- 'healthy', 'degraded', 'offline', 'maintenance'
  is_maintenance BOOLEAN DEFAULT false,
  is_enabled_for_deployments BOOLEAN DEFAULT true,
  hosted_apps_count INT DEFAULT 0,
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Customer Cloud Subscriptions (Tracks Trial & Paid Plans via Central Wallet)
CREATE TABLE IF NOT EXISTS cloud_subscriptions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  plan_id VARCHAR(100) REFERENCES cloud_plans(id),
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'trialing', 'past_due', 'cancelled', 'expired'
  is_trial BOOLEAN DEFAULT false,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  last_payment_tx_id VARCHAR(255),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cloud_sub_user ON cloud_subscriptions(user_id);

-- User Trial Tracking (Ensures 1 Free Trial per user)
CREATE TABLE IF NOT EXISTS cloud_user_meta (
  user_id VARCHAR(255) PRIMARY KEY,
  trial_used BOOLEAN DEFAULT false,
  trial_started_at TIMESTAMP WITH TIME ZONE,
  preferred_currency VARCHAR(10) DEFAULT 'RWF',
  country VARCHAR(100) DEFAULT 'Rwanda',
  country_code VARCHAR(10) DEFAULT 'RW',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Customer Cloud Projects
CREATE TABLE IF NOT EXISTS cloud_projects (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cloud_proj_user ON cloud_projects(user_id);

-- 6. Customer Cloud Deployments & Applications
CREATE TABLE IF NOT EXISTS cloud_deployments (
  id VARCHAR(255) PRIMARY KEY,
  project_id VARCHAR(255) REFERENCES cloud_projects(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  server_id VARCHAR(255) REFERENCES cloud_servers(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  framework VARCHAR(100) DEFAULT 'nodejs', -- 'nodejs', 'react', 'nextjs', 'python', 'php', 'docker', 'static'
  source_type VARCHAR(50) NOT NULL, -- 'github', 'zip'
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
  env_variables TEXT, -- Encrypted JSON key-values
  status VARCHAR(50) DEFAULT 'queued', -- 'queued', 'building', 'running', 'stopped', 'failed'
  coolify_app_uuid VARCHAR(255),
  container_id VARCHAR(255),
  live_url VARCHAR(500),
  assigned_subdomain VARCHAR(255), -- e.g. myapp.apps.benix.space
  cpu_limit NUMERIC(5,2),
  ram_limit_mb INT,
  last_deployed_at TIMESTAMP WITH TIME ZONE,
  last_logs TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cloud_dep_user ON cloud_deployments(user_id);
CREATE INDEX IF NOT EXISTS idx_cloud_dep_project ON cloud_deployments(project_id);

-- 7. Managed Customer Databases
CREATE TABLE IF NOT EXISTS cloud_databases (
  id VARCHAR(255) PRIMARY KEY,
  project_id VARCHAR(255) REFERENCES cloud_projects(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  server_id VARCHAR(255) REFERENCES cloud_servers(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  engine VARCHAR(50) NOT NULL, -- 'postgres', 'mysql', 'mariadb'
  version VARCHAR(50) DEFAULT 'latest',
  db_name VARCHAR(100) NOT NULL,
  db_user VARCHAR(100) NOT NULL,
  db_password_encrypted TEXT NOT NULL,
  internal_port INT NOT NULL,
  host_port INT,
  connection_uri_masked TEXT,
  coolify_db_uuid VARCHAR(255),
  container_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'provisioning', -- 'provisioning', 'running', 'stopped', 'failed'
  storage_used_mb INT DEFAULT 0,
  last_backup_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cloud_db_user ON cloud_databases(user_id);

-- 8. Customer Custom Domains & SSL Management
CREATE TABLE IF NOT EXISTS cloud_domains (
  id VARCHAR(255) PRIMARY KEY,
  deployment_id VARCHAR(255) REFERENCES cloud_deployments(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  domain_name VARCHAR(255) UNIQUE NOT NULL,
  is_custom BOOLEAN DEFAULT true,
  verification_token VARCHAR(255) NOT NULL,
  dns_verified BOOLEAN DEFAULT false,
  ssl_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'active', 'failed'
  ssl_issuer VARCHAR(100) DEFAULT 'Let\'s Encrypt',
  ssl_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cloud_dom_dep ON cloud_domains(deployment_id);

-- 9. Customer Support Tickets
CREATE TABLE IF NOT EXISTS cloud_tickets (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  department VARCHAR(100) DEFAULT 'Technical Support',
  priority VARCHAR(50) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cloud_ticket_messages (
  id VARCHAR(255) PRIMARY KEY,
  ticket_id VARCHAR(255) REFERENCES cloud_tickets(id) ON DELETE CASCADE,
  sender_id VARCHAR(255) NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  sender_role VARCHAR(50) DEFAULT 'customer', -- 'customer', 'admin', 'agent'
  message TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Immutable Security Audit Logs
CREATE TABLE IF NOT EXISTS cloud_audit_logs (
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
);
CREATE INDEX IF NOT EXISTS idx_cloud_audit_action ON cloud_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_cloud_audit_created ON cloud_audit_logs(created_at);

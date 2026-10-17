-- =====================================================================
-- KUNDA SPACE: PRODUCTION DATABASE SCHEMA (MySQL 5.7+ / 8.0+ / MariaDB)
-- Designed for cPanel, CloudLinux, Docker, and standard MySQL servers.
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) NOT NULL DEFAULT 'user',
    `dob` DATE NOT NULL,
    `phone` VARCHAR(50) NULL,
    `phone_code` VARCHAR(10) NULL,
    `preferred_language` VARCHAR(10) NOT NULL DEFAULT 'en',
    `email_verified` BOOLEAN NOT NULL DEFAULT FALSE,
    `phone_verified` BOOLEAN NOT NULL DEFAULT FALSE,
    `is_suspended` BOOLEAN NOT NULL DEFAULT FALSE,
    `suspension_reason` TEXT NULL,
    `terms_accepted_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `privacy_accepted_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_email` (`email`),
    INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS `profiles` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `user_id` VARCHAR(36) NOT NULL UNIQUE,
    `display_name` VARCHAR(100) NOT NULL,
    `gender` VARCHAR(50) NOT NULL,
    `interested_in` VARCHAR(50) NOT NULL,
    `country` VARCHAR(100) NOT NULL DEFAULT 'Rwanda',
    `city` VARCHAR(100) NOT NULL DEFAULT 'Kigali',
    `bio` TEXT NULL,
    `height` INT NULL,
    `languages` JSON NULL,
    `education` VARCHAR(100) NULL,
    `occupation` VARCHAR(100) NULL,
    `relationship_intention` VARCHAR(100) NOT NULL DEFAULT 'serious_relationship',
    `children_status` VARCHAR(100) NULL,
    `lifestyle_drinking` VARCHAR(50) NULL,
    `lifestyle_smoking` VARCHAR(50) NULL,
    `contact_sharing_consent` BOOLEAN NOT NULL DEFAULT FALSE,
    `profile_completed` BOOLEAN NOT NULL DEFAULT FALSE,
    `verified_badge` BOOLEAN NOT NULL DEFAULT FALSE,
    `photos` JSON NULL,
    `interests` JSON NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_profiles_user_id` (`user_id`),
    INDEX `idx_profiles_country_city` (`country`, `city`),
    INDEX `idx_profiles_gender_intent` (`gender`, `interested_in`, `relationship_intention`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. PROFILE PHOTOS
CREATE TABLE IF NOT EXISTS `profile_photos` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `profile_id` VARCHAR(36) NOT NULL,
    `photo_url` TEXT NOT NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT FALSE,
    `display_order` INT NOT NULL DEFAULT 0,
    `moderation_status` VARCHAR(50) NOT NULL DEFAULT 'approved',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_photos_profile` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
    INDEX `idx_photos_profile` (`profile_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. PROFILE PREFERENCES
CREATE TABLE IF NOT EXISTS `profile_preferences` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `profile_id` VARCHAR(36) NOT NULL UNIQUE,
    `min_age` INT NOT NULL DEFAULT 20,
    `max_age` INT NOT NULL DEFAULT 45,
    `preferred_country` VARCHAR(100) NOT NULL DEFAULT 'Rwanda',
    `preferred_cities` JSON NULL,
    `dating_scope` VARCHAR(50) NOT NULL DEFAULT 'local',
    `appearance_skin_tone` VARCHAR(50) NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_pref_profile` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. INTERESTS & USER_INTERESTS
CREATE TABLE IF NOT EXISTS `interests` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `category` VARCHAR(50) NOT NULL,
    `name_en` VARCHAR(100) NOT NULL,
    `name_rw` VARCHAR(100) NOT NULL,
    `name_fr` VARCHAR(100) NOT NULL,
    `icon` VARCHAR(50) NULL,
    UNIQUE KEY `unique_interest_en` (`name_en`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_interests` (
    `profile_id` VARCHAR(36) NOT NULL,
    `interest_id` VARCHAR(36) NOT NULL,
    PRIMARY KEY (`profile_id`, `interest_id`),
    CONSTRAINT `fk_ui_profile` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ui_interest` FOREIGN KEY (`interest_id`) REFERENCES `interests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. LIKES, PASSES, MATCHES
CREATE TABLE IF NOT EXISTS `likes` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `from_user_id` VARCHAR(36) NOT NULL,
    `to_user_id` VARCHAR(36) NOT NULL,
    `is_super_like` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_user_like` (`from_user_id`, `to_user_id`),
    CONSTRAINT `fk_likes_from` FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_likes_to` FOREIGN KEY (`to_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_likes_to` (`to_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `passes` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `from_user_id` VARCHAR(36) NOT NULL,
    `to_user_id` VARCHAR(36) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_user_pass` (`from_user_id`, `to_user_id`),
    CONSTRAINT `fk_passes_from` FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_passes_to` FOREIGN KEY (`to_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `matches` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `user1_id` VARCHAR(36) NOT NULL,
    `user2_id` VARCHAR(36) NOT NULL,
    `compatibility_score` INT NOT NULL DEFAULT 85,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_match_pair` (`user1_id`, `user2_id`),
    CONSTRAINT `fk_matches_u1` FOREIGN KEY (`user1_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_matches_u2` FOREIGN KEY (`user2_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_matches_users` (`user1_id`, `user2_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. CONVERSATIONS & MESSAGES
CREATE TABLE IF NOT EXISTS `conversations` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `conversation_participants` (
    `conversation_id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `last_read_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`conversation_id`, `user_id`),
    CONSTRAINT `fk_cp_convo` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_cp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `messages` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `conversation_id` VARCHAR(36) NOT NULL,
    `sender_id` VARCHAR(36) NOT NULL,
    `recipient_id` VARCHAR(36) NOT NULL,
    `content` TEXT NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
    `read_at` DATETIME NULL,
    `is_flagged` BOOLEAN NOT NULL DEFAULT FALSE,
    `moderation_note` TEXT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_msg_convo` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_msg_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_msg_recipient` FOREIGN KEY (`recipient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_messages_conversation` (`conversation_id`, `created_at`),
    INDEX `idx_messages_unread` (`recipient_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. MESSAGE ALLOWANCES
CREATE TABLE IF NOT EXISTS `message_allowances` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `user_id` VARCHAR(36) NOT NULL UNIQUE,
    `initial_free_remaining` INT NOT NULL DEFAULT 3,
    `distinct_recipients_contacted` JSON NULL,
    `free_replies_remaining` INT NOT NULL DEFAULT 3,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_allow_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. WALLETS & TRANSACTIONS
CREATE TABLE IF NOT EXISTS `wallets` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `user_id` VARCHAR(36) NOT NULL UNIQUE,
    `balance_minor` BIGINT NOT NULL DEFAULT 0,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'RWF',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_wallets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wallet_transactions` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `wallet_id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `amount_minor` BIGINT NOT NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'RWF',
    `type` VARCHAR(50) NOT NULL,
    `description` TEXT NOT NULL,
    `reference` VARCHAR(100) NOT NULL UNIQUE,
    `idempotency_key` VARCHAR(100) NULL UNIQUE,
    `status` VARCHAR(50) NOT NULL DEFAULT 'completed',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_wt_wallet` FOREIGN KEY (`wallet_id`) REFERENCES `wallets` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_wt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_transactions_user` (`user_id`, `created_at`),
    INDEX `idx_transactions_ref` (`reference`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. SUBSCRIPTION PLANS & USER SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS `subscription_plans` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `code` VARCHAR(50) NOT NULL UNIQUE,
    `name_en` VARCHAR(100) NOT NULL,
    `name_rw` VARCHAR(100) NOT NULL,
    `name_fr` VARCHAR(100) NOT NULL,
    `description_en` TEXT NULL,
    `description_rw` TEXT NULL,
    `description_fr` TEXT NULL,
    `price_minor` BIGINT NOT NULL DEFAULT 0,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'RWF',
    `duration_days` INT NOT NULL DEFAULT 0,
    `messaging_limit` INT NOT NULL DEFAULT -1,
    `can_unlock_contacts` BOOLEAN NOT NULL DEFAULT FALSE,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `display_order` INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `subscriptions` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `user_id` VARCHAR(36) NOT NULL,
    `plan_id` VARCHAR(36) NOT NULL,
    `started_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expires_at` DATETIME NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'active',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_sub_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_sub_plan` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`),
    INDEX `idx_subscriptions_user_status` (`user_id`, `status`, `expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. PAYMENT ATTEMPTS & WEBHOOK EVENTS
CREATE TABLE IF NOT EXISTS `payment_attempts` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `user_id` VARCHAR(36) NOT NULL,
    `tx_ref` VARCHAR(100) NOT NULL UNIQUE,
    `flw_ref` VARCHAR(100) NULL,
    `amount_minor` BIGINT NOT NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'RWF',
    `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
    `payment_method` VARCHAR(50) NULL,
    `meta` JSON NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_pa_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payment_webhook_events` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `event_id` VARCHAR(100) NULL UNIQUE,
    `event_type` VARCHAR(100) NOT NULL,
    `payload` JSON NOT NULL,
    `processed` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. CONTACT UNLOCKS
CREATE TABLE IF NOT EXISTS `contact_unlocks` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `requester_id` VARCHAR(36) NOT NULL,
    `target_user_id` VARCHAR(36) NOT NULL,
    `amount_paid_minor` BIGINT NOT NULL DEFAULT 2000,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'RWF',
    `consent_given_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_contact_unlock` (`requester_id`, `target_user_id`),
    CONSTRAINT `fk_cu_req` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_cu_tgt` FOREIGN KEY (`target_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS `notifications` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `user_id` VARCHAR(36) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `body` TEXT NOT NULL,
    `link_url` VARCHAR(255) NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_notifications_user` (`user_id`, `is_read`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. BLOCKS, REPORTS, MODERATION EVENTS
CREATE TABLE IF NOT EXISTS `blocks` (
    `blocker_id` VARCHAR(36) NOT NULL,
    `blocked_id` VARCHAR(36) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`blocker_id`, `blocked_id`),
    CONSTRAINT `fk_blocks_blocker` FOREIGN KEY (`blocker_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_blocks_blocked` FOREIGN KEY (`blocked_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reports` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `reporter_id` VARCHAR(36) NOT NULL,
    `reported_user_id` VARCHAR(36) NOT NULL,
    `reason` VARCHAR(100) NOT NULL,
    `details` TEXT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_rep_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_rep_target` FOREIGN KEY (`reported_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. MODERATION EVENTS
CREATE TABLE IF NOT EXISTS `moderation_events` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `user_id` VARCHAR(36) NULL,
    `event_type` VARCHAR(100) NOT NULL,
    `raw_content` TEXT NULL,
    `risk_score` INT DEFAULT 0,
    `action_taken` VARCHAR(100) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_mod_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. ADMIN SETTINGS
CREATE TABLE IF NOT EXISTS `admin_settings` (
    `key` VARCHAR(100) NOT NULL PRIMARY KEY,
    `value` JSON NOT NULL,
    `description` TEXT NULL,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. AUDIT LOGS
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `admin_id` VARCHAR(36) NULL,
    `action` VARCHAR(100) NOT NULL,
    `target_type` VARCHAR(50) NULL,
    `target_id` VARCHAR(100) NULL,
    `details` JSON NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_audit_admin` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

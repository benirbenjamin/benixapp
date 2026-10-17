-- =====================================================================
-- KUNDA SPACE: SEED DATA (MySQL Compatible)
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. SUBSCRIPTION PLANS
INSERT INTO `subscription_plans` (`id`, `code`, `name_en`, `name_rw`, `name_fr`, `description_en`, `description_rw`, `description_fr`, `price_minor`, `currency`, `duration_days`, `messaging_limit`, `can_unlock_contacts`, `is_active`, `display_order`)
VALUES
(
    'sp-free-0001',
    'free',
    'Free Starter',
    'Ibanze ku Buntu',
    'Débutant Gratuit',
    'Explore verified members, 3 free messages to new people and 3 free replies.',
    'Reba abanyamuryango, ubutumwa 3 ku buntu ku bantu bashya n\'ibisubizo 3.',
    'Explorez les profils vérifiés, 3 messages gratuits et 3 réponses gratuites.',
    0, 'RWF', 0, 3, false, true, 1
),
(
    'sp-three-day-0002',
    'three_day',
    '3-Day Connection Pass',
    'Icyumweru Gitoya (Iminsi 3)',
    'Pass Connexion 3 Jours',
    'Unlimited conversations for 72 hours. Perfect for weekend romance.',
    'Ubutumwa budafite umupaka mu masaha 72. Byiza ku mpera z\'icyumweru.',
    'Conversations illimitées pendant 72 heures. Idéal pour le week-end.',
    1500, 'RWF', 3, -1, false, true, 2
),
(
    'sp-weekly-0003',
    'weekly',
    'Weekly Premium',
    'Icyumweru Cyose',
    'Pass Hebdomadaire Premium',
    'Full access for 7 days with priority discovery and unlimited messaging.',
    'Kuganira bidahagarara icyumweru cyose no kugaragara mbere.',
    'Accès illimité pendant 7 jours avec visibilité prioritaire.',
    3000, 'RWF', 7, -1, false, true, 3
),
(
    'sp-pay-msg-0004',
    'pay_per_message',
    'Pay As You Go',
    'Kwishyura buri butumwa',
    'Paiement par message',
    'Only pay when you send a message after your free allowance is used.',
    'Ishyura gusa ubutumwa wohereje iyo ubufasha bw\'ubuntu burangiye.',
    'Payez uniquement lorsque vous envoyez un message hors forfait gratuit.',
    150, 'RWF', 0, 1, false, true, 4
),
(
    'sp-contact-unlock-0005',
    'contact_unlock',
    'Direct Contact Unlock',
    'Kureba Nimero ya Telefone',
    'Déblocage Contact Direct',
    'Unlock phone number when the member gives mutual consent.',
    'Reba numero ya telefone mugihe mwembi mwabyemeranyijweho.',
    'Débloquez le numéro de téléphone avec consentement mutuel.',
    2000, 'RWF', 0, 0, true, true, 5
)
ON DUPLICATE KEY UPDATE
    `name_en` = VALUES(`name_en`),
    `price_minor` = VALUES(`price_minor`);

-- 2. DEFAULT INTERESTS (Bilingual & Trilingual)
INSERT IGNORE INTO `interests` (`id`, `category`, `name_en`, `name_rw`, `name_fr`, `icon`) VALUES
('int-1', 'culture', 'Traditional Dance & Music', 'Imbyino n\'Indirimbo gakondo', 'Danse et Musique Traditionnelle', 'music'),
('int-2', 'culture', 'Art & Photography', 'Ubugeni n\'Amafoto', 'Art et Photographie', 'camera'),
('int-3', 'lifestyle', 'Coffee & Tea Tasting', 'Kunywa Ikawa n\'Icyayi', 'Café et Dégustation de Thé', 'coffee'),
('int-4', 'lifestyle', 'Dining Out & Foodie', 'Gusangira Restaurant', 'Gastronomie et Restaurants', 'utensils'),
('int-5', 'active', 'Hiking in 1000 Hills', 'Gutembera Imisozi', 'Randonnée dans les 1000 Collines', 'mountain'),
('int-6', 'active', 'Fitness & Gym', 'Siporo no Kwiruka', 'Fitness et Gym', 'activity'),
('int-7', 'social', 'Book Club & Reading', 'Gusoma Ibitabo', 'Lecture et Livres', 'book-open'),
('int-8', 'social', 'Tech & Entrepreneurship', 'Ikoranabuhanga n\'Ubucuruzi', 'Tech et Entrepreneuriat', 'laptop'),
('int-9', 'travel', 'Travel & Road Trips', 'Ingendo no Gutembera', 'Voyages et Road Trips', 'compass'),
('int-10', 'lifestyle', 'Faith & Spirituality', 'Kwizera n\'Ubuzima bw\'Umwuka', 'Spiritualité et Foi', 'heart');

-- 3. ADMIN SETTINGS
INSERT INTO `admin_settings` (`key`, `value`, `description`) VALUES
('free_initial_messages', CAST('3' AS JSON), 'Number of free initial outgoing messages to distinct people'),
('free_distinct_recipients', CAST('3' AS JSON), 'Max distinct people a user can message for free'),
('free_replies', CAST('3' AS JSON), 'Number of free replies granted to a user'),
('pay_per_message_cost', CAST('150' AS JSON), 'Cost in RWF for pay-as-you-go message'),
('contact_unlock_cost', CAST('2000' AS JSON), 'Cost in RWF to unlock a phone number with mutual consent'),
('default_currency', CAST('"RWF"' AS JSON), 'Primary currency for transactions'),
('matching_weights', CAST('{"intention": 25, "age": 20, "location": 15, "interests": 15, "language": 10, "lifestyle": 10, "other": 5}' AS JSON), 'Weights for compatibility calculation (0-100)'),
('moderation_strictness', CAST('"high"' AS JSON), 'Enforcement level for phone number and social media leaks')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

-- 4. DEFAULT SUPER ADMIN (Password: Admin@Kunda2026!)
INSERT IGNORE INTO `users` (`id`, `email`, `password_hash`, `role`, `dob`, `phone`, `phone_code`, `preferred_language`, `email_verified`, `phone_verified`)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin@kunda.space',
    '$2a$10$wE73kYpQ9a83B3qKz0R0QegE8s9N8xV9PkWgK2U3a1OQh1sBf8v4G',
    'super_admin',
    '1990-05-15',
    '788123456',
    '+250',
    'rw',
    true,
    true
);

-- 5. INITIAL WALLET FOR ADMIN
INSERT IGNORE INTO `wallets` (`id`, `user_id`, `balance_minor`, `currency`)
VALUES ('w-a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 50000, 'RWF');

SET FOREIGN_KEY_CHECKS = 1;

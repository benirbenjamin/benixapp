// =====================================================================
// GET & POST /api/admin/settings - Dynamic Business Configuration
// =====================================================================
import { extractAuthUser, isAuthorizedRole } from '../../_lib/auth.js';
import { memoryStore, loadAdminSettingsFromDb, saveAdminSettingToDb } from '../../_lib/db.js';
import { BUSINESS_CONFIG } from '../../_lib/config.js';

export default async function handler(req: any, res: any) {
  // Ensure settings are synced from DB
  await loadAdminSettingsFromDb();

  // Public settings endpoint (safe business pricing without secrets)
  if (req.method === 'GET' && req.query?.public === 'true') {
    return res.status(200).json({
      success: true,
      settings: {
        freeInitialMessages: Number(memoryStore.adminSettings.get('free_initial_messages') ?? BUSINESS_CONFIG.FREE_INITIAL_MESSAGES),
        freeDistinctRecipients: Number(memoryStore.adminSettings.get('free_distinct_recipients') ?? BUSINESS_CONFIG.FREE_DISTINCT_RECIPIENTS),
        freeReplies: Number(memoryStore.adminSettings.get('free_replies') ?? BUSINESS_CONFIG.FREE_REPLIES_ALLOWED),
        hourlyPassPrice: Number(memoryStore.adminSettings.get('hourly_pass_cost') ?? BUSINESS_CONFIG.HOURLY_PASS_PRICE_RWF),
        threeDayPassPrice: Number(memoryStore.adminSettings.get('three_day_pass_cost') ?? BUSINESS_CONFIG.THREE_DAY_PASS_PRICE_RWF),
        weeklyPassPrice: Number(memoryStore.adminSettings.get('weekly_pass_cost') ?? BUSINESS_CONFIG.WEEKLY_PASS_PRICE_RWF),
        payPerMessagePrice: Number(memoryStore.adminSettings.get('pay_per_message_cost') ?? BUSINESS_CONFIG.PAY_PER_MESSAGE_PRICE_RWF),
        contactUnlockPrice: Number(memoryStore.adminSettings.get('contact_unlock_cost') ?? BUSINESS_CONFIG.CONTACT_UNLOCK_PRICE_RWF),
        welcomeBonusAmount: Number(memoryStore.adminSettings.get('welcome_bonus_amount') ?? BUSINESS_CONFIG.WELCOME_BONUS_RWF),
        referralSignupReward: Number(memoryStore.adminSettings.get('referral_signup_reward') ?? BUSINESS_CONFIG.REFERRAL_SIGNUP_REWARD_RWF),
        referralDepositCommissionPct: Number(memoryStore.adminSettings.get('referral_deposit_commission_pct') ?? BUSINESS_CONFIG.REFERRAL_DEPOSIT_COMMISSION_PCT),
        contactUnlockCommissionPct: Number(memoryStore.adminSettings.get('contact_unlock_commission_pct') ?? BUSINESS_CONFIG.CONTACT_UNLOCK_COMMISSION_PCT),
        minimumWithdrawalAmount: Number(memoryStore.adminSettings.get('minimum_withdrawal_amount') ?? BUSINESS_CONFIG.MINIMUM_WITHDRAWAL_RWF),
        defaultCurrency: (memoryStore.adminSettings.get('default_currency') as string) || BUSINESS_CONFIG.DEFAULT_CURRENCY,
      }
    });
  }

  const auth = extractAuthUser(req);
  if (!auth || !isAuthorizedRole(auth.role, ['super_admin', 'admin'])) {
    return res.status(403).json({ success: false, error: 'Forbidden: Admin access required.' });
  }

  // GET: Fetch all current settings
  if (req.method === 'GET') {
    const currentSettings = {
      // Free Allowances
      freeInitialMessages: memoryStore.adminSettings.get('free_initial_messages') ?? BUSINESS_CONFIG.FREE_INITIAL_MESSAGES,
      freeDistinctRecipients: memoryStore.adminSettings.get('free_distinct_recipients') ?? BUSINESS_CONFIG.FREE_DISTINCT_RECIPIENTS,
      freeReplies: memoryStore.adminSettings.get('free_replies') ?? BUSINESS_CONFIG.FREE_REPLIES_ALLOWED,
      
      // Dynamic Plan Pricing & Costs
      hourlyPassPrice: memoryStore.adminSettings.get('hourly_pass_cost') ?? BUSINESS_CONFIG.HOURLY_PASS_PRICE_RWF,
      threeDayPassPrice: memoryStore.adminSettings.get('three_day_pass_cost') ?? BUSINESS_CONFIG.THREE_DAY_PASS_PRICE_RWF,
      weeklyPassPrice: memoryStore.adminSettings.get('weekly_pass_cost') ?? BUSINESS_CONFIG.WEEKLY_PASS_PRICE_RWF,
      payPerMessagePrice: memoryStore.adminSettings.get('pay_per_message_cost') ?? BUSINESS_CONFIG.PAY_PER_MESSAGE_PRICE_RWF,
      contactUnlockPrice: memoryStore.adminSettings.get('contact_unlock_cost') ?? BUSINESS_CONFIG.CONTACT_UNLOCK_PRICE_RWF,
      welcomeBonusAmount: memoryStore.adminSettings.get('welcome_bonus_amount') ?? BUSINESS_CONFIG.WELCOME_BONUS_RWF,
      referralSignupReward: memoryStore.adminSettings.get('referral_signup_reward') ?? BUSINESS_CONFIG.REFERRAL_SIGNUP_REWARD_RWF,
      referralDepositCommissionPct: memoryStore.adminSettings.get('referral_deposit_commission_pct') ?? BUSINESS_CONFIG.REFERRAL_DEPOSIT_COMMISSION_PCT,
      contactUnlockCommissionPct: memoryStore.adminSettings.get('contact_unlock_commission_pct') ?? BUSINESS_CONFIG.CONTACT_UNLOCK_COMMISSION_PCT,
      minimumWithdrawalAmount: memoryStore.adminSettings.get('minimum_withdrawal_amount') ?? BUSINESS_CONFIG.MINIMUM_WITHDRAWAL_RWF,
      defaultCurrency: memoryStore.adminSettings.get('default_currency') ?? BUSINESS_CONFIG.DEFAULT_CURRENCY,
      moderationStrictness: memoryStore.adminSettings.get('moderation_strictness') ?? 'high',
      
      // Email Provider settings
      emailProvider: memoryStore.adminSettings.get('email_provider') ?? 'mock',
      resendApiKey: memoryStore.adminSettings.get('resend_api_key') ?? '',
      resendFromEmail: memoryStore.adminSettings.get('resend_from_email') ?? 'Kunda Space <onboarding@resend.dev>',
      smtpHost: memoryStore.adminSettings.get('smtp_host') ?? 'smtp.gmail.com',
      smtpPort: memoryStore.adminSettings.get('smtp_port') ?? 587,
      smtpSecure: memoryStore.adminSettings.get('smtp_secure') ?? false,
      smtpUser: memoryStore.adminSettings.get('smtp_user') ?? '',
      smtpPass: memoryStore.adminSettings.get('smtp_pass') ?? '',
      smtpFromEmail: memoryStore.adminSettings.get('smtp_from_email') ?? 'Kunda Space <noreply@kunda.space>',
      
      // Google Drive Refresh Token settings
      googleDriveClientId: memoryStore.adminSettings.get('google_drive_client_id') ?? '',
      googleDriveClientSecret: memoryStore.adminSettings.get('google_drive_client_secret') ?? '',
      googleDriveRefreshToken: memoryStore.adminSettings.get('google_drive_refresh_token') ?? '',
      googleDriveFolderId: memoryStore.adminSettings.get('google_drive_folder_id') ?? '',
    };

    return res.status(200).json({ success: true, settings: currentSettings });
  }

  // POST: Update settings with database persistence
  if (req.method === 'POST') {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid settings payload' });
    }

    const savePromises: Promise<any>[] = [];

    // 1. Business pricing and allowances
    if (updates.freeInitialMessages !== undefined) {
      const val = parseInt(updates.freeInitialMessages, 10);
      savePromises.push(saveAdminSettingToDb('free_initial_messages', val));
      for (const [, al] of memoryStore.allowances.entries()) {
        al.initialRemaining = Math.max(0, val - (al.distinctRecipients?.length || 0));
      }
    }
    if (updates.freeDistinctRecipients !== undefined) {
      savePromises.push(saveAdminSettingToDb('free_distinct_recipients', parseInt(updates.freeDistinctRecipients, 10)));
    }
    if (updates.freeReplies !== undefined) {
      const val = parseInt(updates.freeReplies, 10);
      savePromises.push(saveAdminSettingToDb('free_replies', val));
      for (const [, al] of memoryStore.allowances.entries()) {
        al.repliesRemaining = val;
      }
    }
    if (updates.hourlyPassPrice !== undefined) {
      savePromises.push(saveAdminSettingToDb('hourly_pass_cost', parseInt(updates.hourlyPassPrice, 10)));
    }
    if (updates.threeDayPassPrice !== undefined) {
      savePromises.push(saveAdminSettingToDb('three_day_pass_cost', parseInt(updates.threeDayPassPrice, 10)));
    }
    if (updates.weeklyPassPrice !== undefined) {
      savePromises.push(saveAdminSettingToDb('weekly_pass_cost', parseInt(updates.weeklyPassPrice, 10)));
    }
    if (updates.payPerMessagePrice !== undefined) {
      savePromises.push(saveAdminSettingToDb('pay_per_message_cost', parseInt(updates.payPerMessagePrice, 10)));
    }
    if (updates.contactUnlockPrice !== undefined) {
      savePromises.push(saveAdminSettingToDb('contact_unlock_cost', parseInt(updates.contactUnlockPrice, 10)));
    }
    if (updates.welcomeBonusAmount !== undefined) {
      savePromises.push(saveAdminSettingToDb('welcome_bonus_amount', parseInt(updates.welcomeBonusAmount, 10)));
    }
    if (updates.referralSignupReward !== undefined) {
      savePromises.push(saveAdminSettingToDb('referral_signup_reward', parseInt(updates.referralSignupReward, 10)));
    }
    if (updates.referralDepositCommissionPct !== undefined) {
      savePromises.push(saveAdminSettingToDb('referral_deposit_commission_pct', parseInt(updates.referralDepositCommissionPct, 10)));
    }
    if (updates.contactUnlockCommissionPct !== undefined) {
      savePromises.push(saveAdminSettingToDb('contact_unlock_commission_pct', parseInt(updates.contactUnlockCommissionPct, 10)));
    }
    if (updates.minimumWithdrawalAmount !== undefined) {
      savePromises.push(saveAdminSettingToDb('minimum_withdrawal_amount', parseInt(updates.minimumWithdrawalAmount, 10)));
    }
    if (updates.defaultCurrency !== undefined) {
      savePromises.push(saveAdminSettingToDb('default_currency', updates.defaultCurrency));
    }
    if (updates.moderationStrictness !== undefined) {
      savePromises.push(saveAdminSettingToDb('moderation_strictness', updates.moderationStrictness));
    }

    // 2. Email Provider settings
    if (updates.emailProvider !== undefined) savePromises.push(saveAdminSettingToDb('email_provider', updates.emailProvider));
    if (updates.resendApiKey !== undefined) savePromises.push(saveAdminSettingToDb('resend_api_key', updates.resendApiKey));
    if (updates.resendFromEmail !== undefined) savePromises.push(saveAdminSettingToDb('resend_from_email', updates.resendFromEmail));
    if (updates.smtpHost !== undefined) savePromises.push(saveAdminSettingToDb('smtp_host', updates.smtpHost));
    if (updates.smtpPort !== undefined) savePromises.push(saveAdminSettingToDb('smtp_port', parseInt(updates.smtpPort, 10)));
    if (updates.smtpSecure !== undefined) savePromises.push(saveAdminSettingToDb('smtp_secure', Boolean(updates.smtpSecure)));
    if (updates.smtpUser !== undefined) savePromises.push(saveAdminSettingToDb('smtp_user', updates.smtpUser));
    if (updates.smtpPass !== undefined) savePromises.push(saveAdminSettingToDb('smtp_pass', updates.smtpPass));
    if (updates.smtpFromEmail !== undefined) savePromises.push(saveAdminSettingToDb('smtp_from_email', updates.smtpFromEmail));

    // 3. Google Drive settings
    if (updates.googleDriveClientId !== undefined) savePromises.push(saveAdminSettingToDb('google_drive_client_id', updates.googleDriveClientId));
    if (updates.googleDriveClientSecret !== undefined) savePromises.push(saveAdminSettingToDb('google_drive_client_secret', updates.googleDriveClientSecret));
    if (updates.googleDriveRefreshToken !== undefined) savePromises.push(saveAdminSettingToDb('google_drive_refresh_token', updates.googleDriveRefreshToken));
    if (updates.googleDriveFolderId !== undefined) savePromises.push(saveAdminSettingToDb('google_drive_folder_id', updates.googleDriveFolderId));

    await Promise.all(savePromises);

    return res.status(200).json({ success: true, message: 'Settings successfully updated and saved to database.' });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

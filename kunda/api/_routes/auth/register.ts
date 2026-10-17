// =====================================================================
// POST /api/auth/register - Three-step wizard submission & adult check
// =====================================================================
import crypto from 'crypto';
import { isAdult, hashPassword, generateToken } from '../../_lib/auth.js';
import { memoryStore, query, loadAdminSettingsFromDb } from '../../_lib/db.js';
import { BUSINESS_CONFIG } from '../../_lib/config.js';
import { sendVerificationEmail } from '../../_lib/email.js';
import { creditWelcomeBonus, creditReferralReward } from '../../_lib/wallet.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const {
      email,
      password,
      dob,
      displayName,
      gender,
      interestedIn,
      country,
      city,
      phone,
      phoneCode,
      preferredLanguage,
      relationshipIntention,
      bio,
      height,
      languages,
      interests,
      photos,
      minAgePref,
      maxAgePref,
      datingScope,
      appearanceSkinTone,
      referralCode,
    } = req.body || {};

    // 1. Mandatory server-side fields check
    if (!email || !password || !dob || !displayName || !gender || !interestedIn) {
      return res.status(400).json({
        success: false,
        error: 'Missing required registration fields (email, password, dob, displayName, gender, interestedIn).',
      });
    }

    // 2. Strict Server-Side 18+ Verification
    if (!isAdult(dob)) {
      return res.status(403).json({
        success: false,
        error: 'Underage registration rejected. Kunda Space is strictly for adults aged 18 and older.',
      });
    }

    // 3. Email uniqueness check
    const existing = memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists. Please sign in.',
      });
    }

    // 4. Hash password
    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();
    const profileId = crypto.randomUUID();

    // Generate 6-digit verification code & token
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const userReferralCode = userId.replace(/-/g, '').slice(0, 8).toUpperCase();

    const newUser: any = {
      id: userId,
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'user',
      dob,
      phone: phone || '',
      phoneCode: phoneCode || '+250',
      preferredLanguage: preferredLanguage || 'en',
      referralCode: userReferralCode,
      referredBy: null,
      emailVerified: false,
      verificationCode,
      verificationToken,
      verificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      phoneVerified: false,
      isSuspended: false,
      createdAt: new Date().toISOString(),
    };

    const newProfile = {
      id: profileId,
      userId,
      displayName: displayName.trim(),
      gender,
      interestedIn,
      country: country || 'Rwanda',
      city: city || 'Kigali',
      bio: bio || '',
      height: height ? parseInt(height, 10) : null,
      languages: Array.isArray(languages) ? languages : ['English', 'Kinyarwanda'],
      relationshipIntention: relationshipIntention || 'serious_relationship',
      interests: Array.isArray(interests) ? interests : [],
      photos: Array.isArray(photos) && photos.length > 0
        ? photos
        : ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'],
      contactSharingConsent: true,
      profileCompleted: true,
      verifiedBadge: false,
      minAgePref: minAgePref || 20,
      maxAgePref: maxAgePref || 50,
      datingScope: datingScope || 'local',
      appearanceSkinTone: appearanceSkinTone || null,
      createdAt: new Date().toISOString(),
    };

    // Check for referral code and credit referrer with withdrawable reward
    await loadAdminSettingsFromDb().catch(() => {});
    if (referralCode && typeof referralCode === 'string' && referralCode.trim()) {
      const trimmedRef = referralCode.trim().toUpperCase();
      const referrer = memoryStore.users.find(
        (u) =>
          (u.referralCode && u.referralCode.toUpperCase() === trimmedRef) ||
          u.id.replace(/-/g, '').toUpperCase().startsWith(trimmedRef) ||
          u.id === referralCode.trim()
      );
      if (referrer && referrer.id !== userId) {
        newUser.referredBy = referrer.id;
        const refReward = Number(
          memoryStore.adminSettings.get('referral_signup_reward') ?? BUSINESS_CONFIG.REFERRAL_SIGNUP_REWARD_RWF
        );
        await creditReferralReward(referrer.id, refReward, newProfile.displayName).catch((err) =>
          console.warn('Referral reward credit warning:', err)
        );
      }
    }

    // Store in memoryStore
    memoryStore.users.push(newUser);
    memoryStore.profiles.push(newProfile);
    memoryStore.allowances.set(userId, {
      initialRemaining: BUSINESS_CONFIG.FREE_INITIAL_MESSAGES,
      distinctRecipients: [],
      repliesRemaining: BUSINESS_CONFIG.FREE_REPLIES_ALLOWED,
    });

    // Credit Welcome Bonus to new user (spendable before deposit!)
    const welcomeBonus = Number(
      memoryStore.adminSettings.get('welcome_bonus_amount') ?? BUSINESS_CONFIG.WELCOME_BONUS_RWF
    );
    await creditWelcomeBonus(userId, welcomeBonus).catch((err) =>
      console.warn('Welcome bonus credit warning:', err)
    );

    // Fast non-blocking email dispatch: attempts delivery immediately without delaying HTTP response
    const proto = (req.headers && req.headers['x-forwarded-proto']) || 'https';
    const host = (req.headers && (req.headers['x-forwarded-host'] || req.headers.host)) || 'kunda-rose.vercel.app';
    const appUrl = `${proto}://${host}`;

    Promise.race([
      sendVerificationEmail(
        newUser.email,
        newProfile.displayName,
        verificationCode,
        verificationToken,
        appUrl
      ),
      new Promise((resolve) => setTimeout(resolve, 2500))
    ]).catch((emailErr) => {
      console.warn('⚠️ Verification email dispatch notice:', emailErr);
    });

    // Non-blocking write to PostgreSQL if connected
    Promise.race([
      query(
        `INSERT INTO users (id, email, password_hash, role, dob, phone, phone_code, preferred_language, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)
         ON CONFLICT (email) DO NOTHING`,
        [userId, newUser.email, passwordHash, 'user', dob, newUser.phone, newUser.phoneCode, newUser.preferredLanguage]
      ),
      new Promise((resolve) => setTimeout(resolve, 2000))
    ]).catch((err) => console.warn('Async DB user insert warning:', err));

    // Generate JWT auth session
    const token = generateToken({
      userId,
      email: newUser.email,
      role: 'user',
      preferredLanguage: newUser.preferredLanguage,
    });

    return res.status(201).json({
      success: true,
      token,
      requiresVerification: true,
      user: {
        id: userId,
        email: newUser.email,
        role: newUser.role,
        preferredLanguage: newUser.preferredLanguage,
        emailVerified: false,
        referralCode: newUser.referralCode,
      },
      profile: newProfile,
    });
  } catch (error: any) {
    console.error('Registration API error:', error);
    return res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
  }
}

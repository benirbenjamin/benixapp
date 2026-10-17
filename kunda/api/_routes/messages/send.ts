// =====================================================================
// GET & POST /api/messages/send - Messaging with Allowance & Moderation
// =====================================================================
import crypto from 'crypto';
import { extractAuthUser } from '../../_lib/auth.js';
import { memoryStore, loadAdminSettingsFromDb, query } from '../../_lib/db.js';
import { checkMessageModeration } from '../../_lib/moderation.js';
import { debitWallet, getWalletBalance } from '../../_lib/wallet.js';
import { BUSINESS_CONFIG } from '../../_lib/config.js';

export default async function handler(req: any, res: any) {
  const auth = extractAuthUser(req);
  if (!auth) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  // Ensure latest dynamic settings from DB are loaded
  await loadAdminSettingsFromDb();

  // --- GET: Fetch message history with partner ---
  if (req.method === 'GET') {
    const partnerId = req.query?.partnerId;
    if (!partnerId) {
      return res.status(400).json({ success: false, error: 'partnerId parameter is required' });
    }

    // Find messages between auth.userId and partnerId
    const history = memoryStore.messages.filter(
      (m) =>
        (m.senderId === auth.userId && m.recipientId === partnerId) ||
        (m.senderId === partnerId && m.recipientId === auth.userId)
    );

    // Mark incoming messages as read
    for (const m of history) {
      if (m.recipientId === auth.userId && !m.isRead) {
        m.isRead = true;
        m.readAt = new Date().toISOString();
      }
    }

    // Current allowance & wallet status
    const freeInitLimit = Number(memoryStore.adminSettings.get('free_initial_messages') ?? BUSINESS_CONFIG.FREE_INITIAL_MESSAGES);
    const freeDistinctLimit = Number(memoryStore.adminSettings.get('free_distinct_recipients') ?? BUSINESS_CONFIG.FREE_DISTINCT_RECIPIENTS);
    const freeRepliesLimit = Number(memoryStore.adminSettings.get('free_replies') ?? BUSINESS_CONFIG.FREE_REPLIES_ALLOWED);

    let allowances = memoryStore.allowances.get(auth.userId);
    if (!allowances) {
      allowances = {
        initialRemaining: freeInitLimit,
        distinctRecipients: [],
        repliesRemaining: freeRepliesLimit,
      };
      memoryStore.allowances.set(auth.userId, allowances);
    }
    const wallet = await getWalletBalance(auth.userId);

    // Active subscription check
    const activeSub = memoryStore.subscriptions.find(
      (s) => s.userId === auth.userId && s.status === 'active' && new Date(s.expiresAt) > new Date()
    );

    // Check contact unlock state
    const isUnlocked = memoryStore.contactUnlocks.some(
      (cu) => cu.requesterId === auth.userId && cu.targetUserId === partnerId
    );

    let partnerUser = memoryStore.users.find((u) => u.id === partnerId);
    let partnerProfile = memoryStore.profiles.find((p) => p.userId === partnerId);

    if (!partnerUser) {
      const uRes = await query('SELECT * FROM users WHERE id = $1', [partnerId]);
      if (uRes?.rows?.[0]) partnerUser = uRes.rows[0];
    }
    if (!partnerProfile) {
      const pRes = await query('SELECT * FROM profiles WHERE user_id = $1', [partnerId]);
      if (pRes?.rows?.[0]) partnerProfile = pRes.rows[0];
    }

    const contactUnlockPrice = Number(
      memoryStore.adminSettings.get('contact_unlock_cost') ?? BUSINESS_CONFIG.CONTACT_UNLOCK_PRICE_RWF
    );

    return res.status(200).json({
      success: true,
      messages: history,
      allowances,
      wallet,
      hasActiveSubscription: Boolean(activeSub),
      isContactUnlocked: isUnlocked,
      contactUnlockPrice,
      partnerName: partnerProfile?.displayName || partnerProfile?.display_name || partnerUser?.displayName || 'Member',
      partnerAvatar: (partnerProfile?.photos && partnerProfile.photos[0]) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      partnerCity: partnerProfile?.city || 'Rwanda',
      partnerPhone: isUnlocked ? `${partnerUser?.phoneCode || partnerUser?.phone_code || '+250'} ${partnerUser?.phone}` : null,
      partnerConsentGiven: partnerProfile?.contactSharingConsent ?? partnerProfile?.contact_sharing_consent ?? true,
    });
  }

  // --- POST: Send message with allowance / wallet verification ---
  if (req.method === 'POST') {
    const { recipientId, content } = req.body;
    if (!recipientId || !content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Recipient ID and message content are required' });
    }

    if (recipientId === auth.userId) {
      return res.status(400).json({ success: false, error: 'Cannot send message to yourself' });
    }

    const trimmedContent = content.trim();

    // 1. Multilingual Content Moderation Check
    const moderation = checkMessageModeration(trimmedContent);
    if (moderation.isViolation) {
      // Record moderation event for admin audit
      memoryStore.moderationEvents.unshift({
        id: crypto.randomUUID(),
        userId: auth.userId,
        eventType: moderation.violationType,
        rawContent: trimmedContent,
        matchedPattern: moderation.matchedPattern,
        actionTaken: 'blocked_with_guidance',
        createdAt: new Date().toISOString(),
      });

      return res.status(422).json({
        success: false,
        error: 'CONTENT_MODERATION_VIOLATION',
        reason: moderation.reason,
        safeSuggestion: moderation.safeSuggestion,
        matchedPattern: moderation.matchedPattern,
      });
    }

    // 2. Allowance & Payment Enforcement
    // Check if user has an active unlimited subscription
    const activeSub = memoryStore.subscriptions.find(
      (s) => s.userId === auth.userId && s.status === 'active' && new Date(s.expiresAt) > new Date()
    );

    let isChargeApplied = false;
    let allowanceMethod = 'unlimited_subscription';

    if (!activeSub) {
      const freeInitLimit = Number(memoryStore.adminSettings.get('free_initial_messages') ?? BUSINESS_CONFIG.FREE_INITIAL_MESSAGES);
      const freeDistinctLimit = Number(memoryStore.adminSettings.get('free_distinct_recipients') ?? BUSINESS_CONFIG.FREE_DISTINCT_RECIPIENTS);
      const freeRepliesLimit = Number(memoryStore.adminSettings.get('free_replies') ?? BUSINESS_CONFIG.FREE_REPLIES_ALLOWED);
      const payPerMsgCost = Number(memoryStore.adminSettings.get('pay_per_message_cost') ?? BUSINESS_CONFIG.PAY_PER_MESSAGE_PRICE_RWF);

      const userAllowances = memoryStore.allowances.get(auth.userId) || {
        initialRemaining: freeInitLimit,
        distinctRecipients: [],
        repliesRemaining: freeRepliesLimit,
      };

      // Check if conversation already exists with this recipient
      const existingThread = memoryStore.messages.some(
        (m) =>
          (m.senderId === auth.userId && m.recipientId === recipientId) ||
          (m.senderId === recipientId && m.recipientId === auth.userId)
      );

      if (!existingThread) {
        // Initial message to a new recipient
        if (
          userAllowances.initialRemaining > 0 &&
          userAllowances.distinctRecipients.length < freeDistinctLimit
        ) {
          userAllowances.initialRemaining -= 1;
          if (!userAllowances.distinctRecipients.includes(recipientId)) {
            userAllowances.distinctRecipients.push(recipientId);
          }
          allowanceMethod = 'free_initial_message';
        } else {
          // Free initial allowance exhausted -> charge pay-per-message
          const debitResult = await debitWallet(
            auth.userId,
            payPerMsgCost,
            'message_fee',
            `Message charge to new recipient (${payPerMsgCost} RWF)`
          );

          if (!debitResult.success) {
            return res.status(402).json({
              success: false,
              error: 'INSUFFICIENT_FUNDS',
              message: debitResult.error || 'Please deposit funds into your wallet to send this message.',
              requiredAmount: payPerMsgCost,
            });
          }
          isChargeApplied = true;
          allowanceMethod = 'paid_pay_per_message';
        }
      } else {
        // Follow-up reply in an existing conversation
        if (userAllowances.repliesRemaining > 0) {
          userAllowances.repliesRemaining -= 1;
          allowanceMethod = 'free_reply';
        } else {
          // Free replies exhausted -> charge pay-per-message
          const debitResult = await debitWallet(
            auth.userId,
            payPerMsgCost,
            'message_fee',
            `Follow-up message charge (${payPerMsgCost} RWF)`
          );

          if (!debitResult.success) {
            return res.status(402).json({
              success: false,
              error: 'INSUFFICIENT_FUNDS',
              message: debitResult.error || 'Please deposit funds into your wallet to send this message.',
              requiredAmount: payPerMsgCost,
            });
          }
          isChargeApplied = true;
          allowanceMethod = 'paid_pay_per_message';
        }
      }

      memoryStore.allowances.set(auth.userId, userAllowances);
    }

    // 3. Save Message
    const messageRecord = {
      id: crypto.randomUUID(),
      senderId: auth.userId,
      recipientId,
      content: trimmedContent,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    memoryStore.messages.push(messageRecord);

    // 4. Send In-App Notification to Recipient
    const senderProfile = memoryStore.profiles.find((p) => p.userId === auth.userId);
    memoryStore.notifications.unshift({
      id: crypto.randomUUID(),
      userId: recipientId,
      type: 'new_message',
      title: `Message from ${senderProfile?.displayName || 'a member'}`,
      body: trimmedContent.length > 50 ? `${trimmedContent.substring(0, 47)}...` : trimmedContent,
      linkUrl: `/dashboard/messages?user=${auth.userId}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    const updatedAllowances = memoryStore.allowances.get(auth.userId);
    const updatedWallet = await getWalletBalance(auth.userId);

    return res.status(201).json({
      success: true,
      message: messageRecord,
      allowanceMethod,
      isChargeApplied,
      allowances: updatedAllowances,
      wallet: updatedWallet,
    });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

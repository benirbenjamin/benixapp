import { describe, it, expect, beforeEach } from 'vitest';
import { BUSINESS_CONFIG } from '../api/_lib/config';

describe('Messaging Allowance & Pay-Per-Message Enforcements', () => {
  interface UserAllowance {
    initialRemaining: number;
    distinctRecipients: string[];
    repliesRemaining: number;
  }

  let allowance: UserAllowance;

  beforeEach(() => {
    allowance = {
      initialRemaining: BUSINESS_CONFIG.FREE_INITIAL_MESSAGES,
      distinctRecipients: [],
      repliesRemaining: BUSINESS_CONFIG.FREE_REPLIES_ALLOWED,
    };
  });

  it('provides configured default free initial and reply counts', () => {
    expect(allowance.initialRemaining).toBe(3);
    expect(allowance.repliesRemaining).toBe(3);
    expect(allowance.distinctRecipients.length).toBe(0);
  });

  it('allows 3 initial messages to distinct recipients and tracks recipient IDs', () => {
    const recipients = ['user-a', 'user-b', 'user-c'];

    for (const r of recipients) {
      expect(allowance.initialRemaining).toBeGreaterThan(0);
      allowance.initialRemaining -= 1;
      allowance.distinctRecipients.push(r);
    }

    expect(allowance.initialRemaining).toBe(0);
    expect(allowance.distinctRecipients.length).toBe(3);
  });

  it('exhausts initial free messages and signals pay-per-message requirement on 4th recipient', () => {
    allowance.initialRemaining = 0;
    allowance.distinctRecipients = ['user-a', 'user-b', 'user-c'];

    const newRecipient = 'user-d';
    const canSendFree = allowance.initialRemaining > 0 && allowance.distinctRecipients.length < 3;
    expect(canSendFree).toBe(false);

    // Requires paid pay-per-message
    const messageCost = BUSINESS_CONFIG.PAY_PER_MESSAGE_PRICE_RWF;
    expect(messageCost).toBe(150);
  });

  it('allows 3 free replies in existing conversations before requiring payment', () => {
    for (let i = 0; i < 3; i++) {
      expect(allowance.repliesRemaining).toBeGreaterThan(0);
      allowance.repliesRemaining -= 1;
    }

    expect(allowance.repliesRemaining).toBe(0);
    const canReplyFree = allowance.repliesRemaining > 0;
    expect(canReplyFree).toBe(false);
  });
});

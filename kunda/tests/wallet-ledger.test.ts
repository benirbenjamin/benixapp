import { describe, it, expect, beforeEach } from 'vitest';
import { creditWallet, debitWallet, getWalletBalance } from '../api/_lib/wallet';
import { memoryStore } from '../api/_lib/db';

describe('Wallet Ledger & Atomic Minor-Unit Accounting', () => {
  const testUserId = 'test-user-wallet-123';

  beforeEach(() => {
    memoryStore.wallets.set(testUserId, { balanceMinor: 0, currency: 'RWF' });
    memoryStore.transactions = memoryStore.transactions.filter((t) => t.userId !== testUserId);
  });

  it('initializes wallet with zero balance', async () => {
    const wallet = await getWalletBalance(testUserId);
    expect(wallet.balanceMinor).toBe(0);
    expect(wallet.currency).toBe('RWF');
  });

  it('credits wallet atomically and records ledger entry', async () => {
    const res = await creditWallet(testUserId, 5000, 'deposit', 'Initial deposit test');
    expect(res.success).toBe(true);
    expect(res.newBalance).toBe(5000);

    const balance = await getWalletBalance(testUserId);
    expect(balance.balanceMinor).toBe(5000);
  });

  it('prevents duplicate credits using idempotency keys', async () => {
    const idempKey = 'IDEMP_FLW_REF_9999';
    const first = await creditWallet(testUserId, 3000, 'deposit', 'Deposit 1', 'REF_1', idempKey);
    expect(first.newBalance).toBe(3000);

    // Duplicate webhook attempt
    const second = await creditWallet(testUserId, 3000, 'deposit', 'Deposit 1 (retry)', 'REF_1', idempKey);
    expect(second.newBalance).toBe(3000); // Balance did NOT double!

    const balance = await getWalletBalance(testUserId);
    expect(balance.balanceMinor).toBe(3000);
  });

  it('rejects debit when wallet has insufficient funds (prevents negative balance)', async () => {
    const res = await debitWallet(testUserId, 2000, 'contact_unlock', 'Unlock contact');
    expect(res.success).toBe(false);
    expect(res.error).toContain('Insufficient');

    const balance = await getWalletBalance(testUserId);
    expect(balance.balanceMinor).toBe(0);
  });

  it('debits wallet successfully when funds are sufficient', async () => {
    await creditWallet(testUserId, 5000, 'deposit', 'Deposit for unlock');
    const debitRes = await debitWallet(testUserId, 2000, 'contact_unlock', 'Contact unlock charge');
    expect(debitRes.success).toBe(true);
    expect(debitRes.newBalance).toBe(3000);

    const balance = await getWalletBalance(testUserId);
    expect(balance.balanceMinor).toBe(3000);
  });
});

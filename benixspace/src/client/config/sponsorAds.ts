export interface SponsorAdItem {
  id: string;
  title: string;
  description: string;
  mediaUrl: string;
  targetUrl: string;
  ctaText: string;
}

export const DEFAULT_SPONSOR_ADS: SponsorAdItem[] = [
  {
    id: 'smm-boost-sponsor',
    title: 'SMM Follows & Growth Boost',
    description: 'Grow YouTube, Instagram, TikTok & Spotify with instant verified delivery.',
    mediaUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=150&auto=format&fit=crop&q=80',
    targetUrl: '/dashboard#smm',
    ctaText: 'Boost Now'
  },
  {
    id: 'central-wallet-sponsor',
    title: 'BenixSpace Central Wallet',
    description: 'Deposit securely via MTN & Airtel MoMo, unlock creator chats, and earn rewards.',
    mediaUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=150&auto=format&fit=crop&q=80',
    targetUrl: '/dashboard#wallet',
    ctaText: 'Open Wallet'
  },
  {
    id: 'rolldice-arena-sponsor',
    title: 'RollDice Arena • Win 1.9x',
    description: 'Play live provably fair dice games and double your payout instantly.',
    mediaUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=150&auto=format&fit=crop&q=80',
    targetUrl: '/games',
    ctaText: 'Play & Win'
  },
  {
    id: 'creator-studio-sponsor',
    title: 'Benix Creator Studio',
    description: 'Upload videos, stories & music. Earn real ad revenue directly to your wallet.',
    mediaUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=150&auto=format&fit=crop&q=80',
    targetUrl: '/studio',
    ctaText: 'Start Earning'
  }
];

export const getEffectiveCustomAd = (
  customAds: any[],
  slotIndex: number = 0
): SponsorAdItem => {
  if (customAds && customAds.length > 0) {
    const ad = customAds[Math.floor(slotIndex) % customAds.length];
    return {
      id: ad.id || `custom-ad-${slotIndex}`,
      title: ad.title || 'Sponsored Partner',
      description: ad.description || 'Promoted sponsor • Creator earns ad revenue',
      mediaUrl: ad.mediaUrl || '/logo.png',
      targetUrl: ad.targetUrl || '/dashboard#wallet',
      ctaText: ad.ctaText || 'Learn More'
    };
  }
  return DEFAULT_SPONSOR_ADS[Math.floor(slotIndex) % DEFAULT_SPONSOR_ADS.length];
};

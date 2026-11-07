export interface SponsorAdItem {
  id: string;
  title: string;
  description: string;
  mediaUrl: string;
  videoUrl?: string;
  mediaType?: 'image' | 'video';
  targetUrl: string;
  ctaText: string;
}

export const DEFAULT_SPONSOR_ADS: SponsorAdItem[] = [
  {
    id: 'smm-boost-sponsor',
    title: 'SMM Follows & Growth Boost',
    description: 'Grow YouTube, Instagram, TikTok & Spotify with instant verified delivery.',
    mediaUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    mediaType: 'video',
    targetUrl: '/dashboard#smm',
    ctaText: 'Boost Now'
  },
  {
    id: 'central-wallet-sponsor',
    title: 'BenixSpace Central Wallet',
    description: 'Deposit securely via MTN & Airtel MoMo, unlock creator chats, and earn rewards.',
    mediaUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    mediaType: 'video',
    targetUrl: '/dashboard#wallet',
    ctaText: 'Open Wallet'
  },
  {
    id: 'rolldice-arena-sponsor',
    title: 'RollDice Arena • Win 1.9x',
    description: 'Play live provably fair dice games and double your payout instantly.',
    mediaUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    mediaType: 'video',
    targetUrl: '/games',
    ctaText: 'Play & Win'
  },
  {
    id: 'creator-studio-sponsor',
    title: 'Benix Creator Studio',
    description: 'Upload videos, stories & music. Earn real ad revenue directly to your wallet.',
    mediaUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    mediaType: 'video',
    targetUrl: '/studio',
    ctaText: 'Start Earning'
  }
];

export const DEFAULT_BANNER_ONLY_ADS: SponsorAdItem[] = DEFAULT_SPONSOR_ADS.map(ad => ({
  ...ad,
  mediaType: 'image' as const,
  videoUrl: undefined
}));

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
      videoUrl: ad.videoUrl || (ad.mediaType === 'video' ? ad.mediaUrl : undefined),
      mediaType: ad.mediaType || (ad.mediaUrl?.includes('.mp4') ? 'video' : 'image'),
      targetUrl: ad.targetUrl || '/dashboard#wallet',
      ctaText: ad.ctaText || 'Learn More'
    };
  }
  return DEFAULT_SPONSOR_ADS[Math.floor(slotIndex) % DEFAULT_SPONSOR_ADS.length];
};

/**
 * Strictly returns a video ad (for Video playing, TV broadcast, and Single Ad Load)
 */
export const getEffectiveVideoAd = (
  customAds: any[],
  slotIndex: number = 0
): SponsorAdItem => {
  const videoCustomAds = (customAds || []).filter(
    (a) => a.mediaType === 'video' || a.videoUrl || (a.mediaUrl && a.mediaUrl.endsWith('.mp4'))
  );
  if (videoCustomAds.length > 0) {
    const ad = videoCustomAds[Math.floor(slotIndex) % videoCustomAds.length];
    return {
      id: ad.id || `custom-video-ad-${slotIndex}`,
      title: ad.title || 'Sponsored Video Partner',
      description: ad.description || 'Promoted video ad • Supporting creator monetization',
      mediaUrl: ad.mediaUrl || '/logo.png',
      videoUrl: ad.videoUrl || ad.mediaUrl,
      mediaType: 'video',
      targetUrl: ad.targetUrl || '/dashboard#wallet',
      ctaText: ad.ctaText || 'Learn More'
    };
  }
  const defaultVideos = DEFAULT_SPONSOR_ADS.filter(a => a.mediaType === 'video');
  return defaultVideos[Math.floor(slotIndex) % defaultVideos.length];
};

/**
 * Strictly returns an image/banner card (for Bottom of Stories and Bottom of Shorts - NEVER VIDEO)
 */
export const getEffectiveBannerOnlyAd = (
  customAds: any[],
  slotIndex: number = 0
): SponsorAdItem => {
  const nonVideoAds = (customAds || []).filter(
    (a) => a.mediaType !== 'video' && (!a.mediaUrl || !a.mediaUrl.endsWith('.mp4'))
  );
  if (nonVideoAds.length > 0) {
    const ad = nonVideoAds[Math.floor(slotIndex) % nonVideoAds.length];
    return {
      id: ad.id || `custom-banner-ad-${slotIndex}`,
      title: ad.title || 'Sponsored Partner',
      description: ad.description || 'Promoted sponsor • Creator earns ad revenue',
      mediaUrl: ad.mediaUrl || '/logo.png',
      mediaType: 'image',
      targetUrl: ad.targetUrl || '/dashboard#wallet',
      ctaText: ad.ctaText || 'Learn More'
    };
  }
  return DEFAULT_BANNER_ONLY_ADS[Math.floor(slotIndex) % DEFAULT_BANNER_ONLY_ADS.length];
};

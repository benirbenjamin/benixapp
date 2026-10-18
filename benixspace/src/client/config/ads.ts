/**
 * Google AdSense & Monetization Configuration for BenixSpace
 * 
 * Client ID: ca-pub-4078466828008985
 * Default Slot: 7034214536
 */

export const ADS_CONFIG = {
  // Google AdSense Publisher ID
  CLIENT_ID: 'ca-pub-4078466828008985',

  // Direct WhatsApp contact for advertisers (+250783987223)
  WHATSAPP_NUMBER: '+250783987223',

  // Radio Ad pre-roll settings (4-minute throttle, 10-second countdown)
  RADIO_AD_INTERVAL_SECONDS: 240, // 4 minutes throttle between ads
  RADIO_AD_COUNTDOWN_SECONDS: 10, // 10 seconds countdown before stream starts

  // Periodic TV Companion Ad Refresh interval (in seconds): 2.5 minutes (150s)
  TV_BANNER_REFRESH_SECONDS: 150,

  // TV Interstitial popup settings (Initial 1-min delay, 5-min repeat interval, 10s countdown)
  TV_AD_INITIAL_DELAY_SECONDS: 60, // 1 minute after starting TV
  TV_AD_INTERVAL_SECONDS: 300, // 5 minutes repeat interval
  TV_AD_COUNTDOWN_SECONDS: 10, // 10 seconds ad timer

  // Google AdSense Ad Slot IDs
  SLOTS: {
    TV_COMPANION_BANNER: '7034214536',
    POPUP_INTERSTITIAL: '7034214536',
    IN_FEED_BANNER: '7034214536',
    RADIO_PREROLL: '7034214536',
    SIDEBAR_BANNER: '7034214536',
    VIDEO_WATCH_BANNER: '7034214536',
  },
} as const;

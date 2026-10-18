import axios from 'axios';
import rawStations from './real_stations.json';

export interface Station {
  id: string | number;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  stream_url: string;
  stream_type: 'HLS' | 'AUDIO' | 'MP3' | 'VIDEO';
  station_type: 'TV' | 'RADIO';
  location: string;
  frequency: string;
  accent_color: string;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
}

export interface VideoItem {
  id: string | number;
  title: string;
  slug: string;
  description: string;
  thumbnail_url: string;
  stream_url: string;
  duration_seconds: number;
  duration_label: string;
  views_count: number;
  category: string;
  publication_date: string;
}

// Full real database station list imported from backup_tv.sql
export const ALL_REAL_STATIONS: Station[] = (rawStations as Station[]).map((st) => ({
  ...st,
  logo_url: st.logo_url || '/logo.png',
  accent_color: st.accent_color || '#0284c7'
}));

export const DATABASE_TV_STATIONS: Station[] = ALL_REAL_STATIONS.filter(s => s.station_type === 'TV');
export const DATABASE_RADIO_STATIONS: Station[] = ALL_REAL_STATIONS.filter(s => s.station_type === 'RADIO');

export const DATABASE_VIDEOS: VideoItem[] = [
  {
    id: 'vid-rtv-news-1',
    title: 'RTV Tele-Amakuru: Amakuru yo ku mugoroba',
    slug: 'rtv-tele-amakuru-umugoroba',
    description: 'Amakuru yose agezweho mu gihugu no hanze yacyo atambutswa live kuri Rwanda Television.',
    thumbnail_url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80',
    stream_url: 'https://5c46fa289c89f.streamlock.net/rtv25/rtv/playlist.m3u8',
    duration_seconds: 2700,
    duration_label: '45:00',
    views_count: 14500,
    category: 'News & Current Affairs',
    publication_date: 'Today'
  },
  {
    id: 'vid-kc2-sports-2',
    title: 'KC2 Sports Zone: Rwanda Premier League & Tour du Rwanda Highlights',
    slug: 'kc2-sports-zone-highlights',
    description: 'Inshamake z’imikino yabaye muri shampiyona y’u Rwanda n’isiganwa mpuzamahanga ry’amagare.',
    thumbnail_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=80',
    stream_url: 'https://5c46fa289c89f.streamlock.net/kc2/kc2/playlist.m3u8',
    duration_seconds: 3600,
    duration_label: '1:00:00',
    views_count: 18200,
    category: 'Sports',
    publication_date: 'Yesterday'
  },
  {
    id: 'vid-rwanda-today-3',
    title: 'Rwanda Today: Transformation of Infrastructure in Kigali & Secondary Cities',
    slug: 'rwanda-today-transformation-infrastructure',
    description: 'Ikiganiro cyihariye kigaragaza iterambere ry’imijyi n’imishinga y’imihanda n’ibikorwa remezo mu Rwanda.',
    thumbnail_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80',
    stream_url: 'https://5c46fa289c89f.streamlock.net/rtv25/rtv/playlist.m3u8',
    duration_seconds: 1800,
    duration_label: '30:00',
    views_count: 9800,
    category: 'Rwanda Today',
    publication_date: '3 days ago'
  }
];

export async function fetchTvStations(): Promise<Station[]> {
  try {
    const res = await axios.get('/api/modules/tv/stations', { timeout: 8000 });
    if (res.data?.stations && Array.isArray(res.data.stations) && res.data.stations.length > 0) {
      return res.data.stations;
    }
  } catch (err) {
    console.warn('Loading TV stations from real backup dataset:', err);
  }
  return DATABASE_TV_STATIONS;
}

export async function fetchRadioStations(): Promise<Station[]> {
  try {
    const res = await axios.get('/api/modules/radio/stations', { timeout: 8000 });
    if (res.data?.stations && Array.isArray(res.data.stations) && res.data.stations.length > 0) {
      return res.data.stations;
    }
  } catch (err) {
    console.warn('Loading Radio stations from real backup dataset:', err);
  }
  return DATABASE_RADIO_STATIONS;
}

export async function fetchVideos(): Promise<VideoItem[]> {
  try {
    const res = await axios.get('/api/modules/tv/videos', { timeout: 8000 });
    if (res.data?.videos && Array.isArray(res.data.videos) && res.data.videos.length > 0) {
      return res.data.videos;
    }
  } catch (err) {}
  return DATABASE_VIDEOS;
}

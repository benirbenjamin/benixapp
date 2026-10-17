const FAVORITES_KEY = 'rba_favorite_stations';

export function getFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function isStationFavorite(stationId: string): boolean {
  const list = getFavorites();
  return list.includes(stationId);
}

export function toggleFavorite(stationId: string): boolean {
  const list = getFavorites();
  let updated: string[];
  let isNowFav: boolean;

  if (list.includes(stationId)) {
    updated = list.filter((id) => id !== stationId);
    isNowFav = false;
  } else {
    updated = [...list, stationId];
    isNowFav = true;
  }

  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  } catch (e) {}

  return isNowFav;
}

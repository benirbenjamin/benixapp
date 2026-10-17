export function getProjectImageUrl(project: any): string {
  if (!project) return '/benix tv.png';
  const slug = String(project.slug || '').toLowerCase();
  const name = String(project.name || '').toLowerCase();
  const rawUrl = String(project.image_url || '').trim();

  if (slug.includes('tv') || name.includes('tv') || rawUrl.includes('benix-tv')) return '/benix tv.png';
  if (slug.includes('game') || name.includes('game') || rawUrl.includes('benix-games')) return '/benix games.png';
  if (slug.includes('calc') || name.includes('calc') || slug.includes('easy') || rawUrl.includes('easy-calc')) return '/easy calc.png';
  if (slug.includes('radio') || name.includes('radio') || rawUrl.includes('radio')) return '/radio-icon.svg';
  if (slug.includes('voxify') || name.includes('voxify') || rawUrl.includes('voxify')) return '/voxify.png';

  if (rawUrl && !rawUrl.includes('postimg.cc')) {
    return rawUrl;
  }

  return '/benix tv.png';
}

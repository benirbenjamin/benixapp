import { query } from '../db/db';

export interface SearchResult {
  id: string;
  module: 'tv' | 'radio' | 'music' | 'marketplace' | 'calc' | 'blog' | 'games';
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
  category?: string;
}

export class SearchService {
  /**
   * Universal search across all active modules
   */
  static async searchGlobal(keyword: string): Promise<SearchResult[]> {
    if (!keyword || keyword.trim().length === 0) return [];

    const term = `%${keyword.trim()}%`;
    const results: SearchResult[] = [];

    // 1. Search Articles
    try {
      const artRes = await query(
        `SELECT id, title, slug, summary, featured_image_url, category 
         FROM articles 
         WHERE (title ILIKE $1 OR summary ILIKE $1) AND status = 'published' 
         LIMIT 6`,
        [term]
      );
      artRes.rows.forEach((r: any) => {
        results.push({
          id: 'art-' + r.id,
          module: 'blog',
          title: r.title,
          description: r.summary || '',
          url: `/blog/${r.slug}`,
          thumbnail: r.featured_image_url,
          category: r.category
        });
      });
    } catch (e) {}

    // 2. Search TV Videos
    try {
      const tvRes = await query(
        `SELECT id, title, slug, description, thumbnail_url 
         FROM tv.videos 
         WHERE (title ILIKE $1 OR description ILIKE $1) 
         LIMIT 6`,
        [term]
      );
      tvRes.rows.forEach((r: any) => {
        results.push({
          id: 'tv-' + r.id,
          module: 'tv',
          title: r.title,
          description: r.description || '',
          url: `/tv?video=${r.id}`,
          thumbnail: r.thumbnail_url,
          category: 'Video Streaming'
        });
      });
    } catch (e) {}

    // 3. Search Radio Stations
    try {
      const radioRes = await query(
        `SELECT id, name, slug, slogan, description 
         FROM radio.radio_stations 
         WHERE (name ILIKE $1 OR slogan ILIKE $1 OR description ILIKE $1) 
         LIMIT 6`,
        [term]
      );
      radioRes.rows.forEach((r: any) => {
        results.push({
          id: 'radio-' + r.id,
          module: 'radio',
          title: r.name,
          description: r.slogan || r.description || '',
          url: `/radio?station=${r.slug}`,
          category: 'Live Radio'
        });
      });
    } catch (e) {}

    // 4. Search Marketplace Products & Services
    try {
      const mktProd = await query(
        `SELECT "id", "title", "description", "price" 
         FROM marketplace."Product" 
         WHERE "title" ILIKE $1 OR "description" ILIKE $1 
         LIMIT 6`,
        [term]
      );
      mktProd.rows.forEach((r: any) => {
        results.push({
          id: 'mkt-p-' + r.id,
          module: 'marketplace',
          title: r.title,
          description: `${r.price} RWF — ${r.description?.substring(0, 100) || ''}`,
          url: `/marketplace?product=${r.id}`,
          category: 'Digital Product'
        });
      });
    } catch (e) {}

    // 5. Search Projects
    try {
      const projRes = await query(
        `SELECT id, name, slug, short_description, image_url, category 
         FROM projects 
         WHERE (name ILIKE $1 OR short_description ILIKE $1) AND status = 'published' 
         LIMIT 6`,
        [term]
      );
      projRes.rows.forEach((r: any) => {
        results.push({
          id: 'proj-' + r.id,
          module: 'tv',
          title: r.name,
          description: r.short_description || '',
          url: `/projects/${r.slug}`,
          thumbnail: r.image_url,
          category: r.category
        });
      });
    } catch (e) {}

    return results;
  }
}

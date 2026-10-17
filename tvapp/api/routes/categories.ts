import { Router, Request, Response } from 'express';
import { query } from '../db/pool.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// GET /api/categories (public)
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(`
      SELECT c.*, COUNT(v.id) as video_count 
      FROM categories c
      LEFT JOIN videos v ON v.category_id = c.id AND v.is_published = true
      GROUP BY c.id
      ORDER BY c.display_order ASC, c.name ASC;
    `);
    res.json(result.rows);
  } catch (err: any) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

// POST /api/categories (admin)
router.post('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, slug, description, display_order } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Category name is required.' });
      return;
    }

    const finalSlug = slug ? slugify(slug) : slugify(name);
    const result = await query(
      `INSERT INTO categories (name, slug, description, display_order)
       VALUES ($1, $2, $3, $4)
       RETURNING *;`,
      [name, finalSlug, description || '', display_order || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('Error creating category:', err);
    res.status(500).json({ error: 'Failed to create category.' });
  }
});

// PUT /api/categories/:id (admin)
router.put('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, slug, description, display_order } = req.body;

    const result = await query(
      `UPDATE categories SET
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        description = COALESCE($3, description),
        display_order = COALESCE($4, display_order)
       WHERE id = $5
       RETURNING *;`,
      [name, slug ? slugify(slug) : undefined, description, display_order, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Error updating category:', err);
    res.status(500).json({ error: 'Failed to update category.' });
  }
});

// DELETE /api/categories/:id (admin)
router.delete('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await query(`DELETE FROM categories WHERE id = $1;`, [id]);
    res.json({ message: 'Category deleted successfully.', id });
  } catch (err: any) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: 'Failed to delete category.' });
  }
});

export default router;

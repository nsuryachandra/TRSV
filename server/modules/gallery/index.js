import express from 'express';
import { query } from '../../config/db.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

// GET /api/modules/gallery - Public read access for all authenticated users
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM gallery ORDER BY created_at DESC');
    res.json({ success: true, images: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin management endpoints
router.use(requireRole(['supreme_admin', 'dev']));

// POST /api/modules/gallery - Create new gallery item(s)
router.post('/', async (req, res) => {
  const { title, caption, category, image_url, images } = req.body;

  try {
    if (images && Array.isArray(images) && images.length > 0) {
      // Bulk insert
      const inserted = [];
      for (const item of images) {
        const url = typeof item === 'string' ? item : item.image_url;
        const itemTitle = typeof item === 'object' ? item.title : (title || 'Gallery Media');
        const itemCaption = typeof item === 'object' ? item.caption : (caption || '');
        const itemCat = typeof item === 'object' ? item.category : (category || 'General');

        if (url) {
          const resIns = await query(`
            INSERT INTO gallery (title, caption, category, image_url)
            VALUES ($1, $2, $3, $4)
            RETURNING *
          `, [itemTitle || 'Gallery Media', itemCaption || '', itemCat || 'General', url]);
          inserted.push(resIns.rows[0]);
        }
      }
      return res.status(201).json({ success: true, images: inserted });
    }

    if (!image_url) {
      return res.status(400).json({ success: false, message: 'Image URL is required.' });
    }

    const result = await query(`
      INSERT INTO gallery (title, caption, category, image_url)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [title || 'Gallery Media', caption || '', category || 'General', image_url]);

    res.status(201).json({ success: true, image: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/modules/gallery/:id - Update gallery item
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, caption, category, image_url } = req.body;

  try {
    const result = await query(`
      UPDATE gallery
      SET 
        title = COALESCE($1, title),
        caption = COALESCE($2, caption),
        category = COALESCE($3, category),
        image_url = COALESCE($4, image_url)
      WHERE id = $5
      RETURNING *
    `, [title, caption, category, image_url, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Gallery item not found.' });
    }

    res.json({ success: true, image: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/modules/gallery/:id - Delete gallery item
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM gallery WHERE id = $1', [id]);
    res.json({ success: true, message: 'Gallery item deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default {
  id: 'gallery',
  name: 'Gallery Management',
  description: 'Manage official organization media assets, campaign photos, and event galleries.',
  permissions: ['manage_gallery'],
  router
};

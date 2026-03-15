const express = require('express');
const PageContent = require('../models/PageContent');
const auth = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/roles');
const { logAction } = require('../services/auditLog');

const router = express.Router();

const VALID_SLUGS = ['about', 'how-it-works'];

// GET /api/pages/:slug - public
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    if (!VALID_SLUGS.includes(slug)) {
      return res.status(404).json({ message: 'Page not found' });
    }

    const page = await PageContent.getOrCreate(slug);
    res.json(page);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/pages/:slug - super admin only
router.put('/:slug', auth, requireSuperAdmin, async (req, res) => {
  try {
    const { slug } = req.params;
    if (!VALID_SLUGS.includes(slug)) {
      return res.status(404).json({ message: 'Page not found' });
    }

    const { title_en, title_ar, title_nl, content_en, content_ar, content_nl } = req.body;

    const page = await PageContent.getOrCreate(slug);

    if (title_en !== undefined) page.title_en = title_en;
    if (title_ar !== undefined) page.title_ar = title_ar;
    if (title_nl !== undefined) page.title_nl = title_nl;
    if (content_en !== undefined) page.content_en = content_en;
    if (content_ar !== undefined) page.content_ar = content_ar;
    if (content_nl !== undefined) page.content_nl = content_nl;

    await page.save();

    res.json(page);

    logAction(req, {
      action: 'update',
      entityType: 'page',
      entityId: page._id,
      details: `Updated page "${slug}"`,
    }).catch(console.error);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

const express = require('express');
const Category = require('../models/Category');
const Book = require('../models/Book');
const auth = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/roles');
const { logAction } = require('../services/auditLog');

const router = express.Router();

// GET /api/categories - public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/categories - super admin only
router.post('/', auth, requireSuperAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const exists = await Category.findOne({ name });
    if (exists) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await Category.create({ name });
    res.status(201).json(category);

    logAction(req, {
      action: 'create',
      entityType: 'category',
      entityId: category._id,
      details: `Created category "${name}"`,
    }).catch(console.error);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/categories/:id - super admin only
router.put('/:id', auth, requireSuperAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);

    logAction(req, {
      action: 'update',
      entityType: 'category',
      entityId: category._id,
      details: `Updated category to "${name}"`,
    }).catch(console.error);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/categories/:id - super admin only
router.delete('/:id', auth, requireSuperAdmin, async (req, res) => {
  try {
    const booksCount = await Book.countDocuments({ category: req.params.id });
    if (booksCount > 0) {
      return res.status(400).json({
        message: `Cannot delete: ${booksCount} book(s) belong to this category`,
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted' });

    logAction(req, {
      action: 'delete',
      entityType: 'category',
      entityId: category._id,
      details: `Deleted category "${category.name}"`,
    }).catch(console.error);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

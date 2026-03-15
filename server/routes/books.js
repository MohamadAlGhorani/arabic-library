const express = require('express');
const Book = require('../models/Book');
const Reservation = require('../models/Reservation');
const auth = require('../middleware/auth');
const { resolveLocation } = require('../middleware/roles');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');
const { logAction } = require('../services/auditLog');

const router = express.Router();

// GET /api/books - public
router.get('/', async (req, res) => {
  try {
    const { search, category, status, location } = req.query;
    const filter = {};

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }
    if (category) {
      filter.category = category;
    }
    if (status) {
      filter.status = status;
    }
    if (location) {
      filter.location = location;
    }

    const books = await Book.find(filter)
      .populate('category', 'name')
      .populate('location', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Attach returnDate for borrowed books and pickup date for reserved books
    const unavailableBookIds = books
      .filter((b) => b.status === 'borrowed' || b.status === 'reserved')
      .map((b) => b._id);

    if (unavailableBookIds.length > 0) {
      const activeReservations = await Reservation.find({
        bookId: { $in: unavailableBookIds },
        status: { $in: ['collected', 'pending'] },
      }).select('bookId returnDate date').lean();

      const reservationMap = {};
      for (const r of activeReservations) {
        reservationMap[r.bookId.toString()] = r;
      }

      for (const book of books) {
        const r = reservationMap[book._id.toString()];
        if (r) {
          if (book.status === 'borrowed' && r.returnDate) {
            book.returnDate = r.returnDate;
          } else if (book.status === 'reserved' && r.date) {
            book.pickupDate = r.date;
          }
        }
      }
    }

    res.json(books);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/books/:id - public
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('category', 'name')
      .populate('location', 'name');
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json(book);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/books - admin
router.post('/', auth, resolveLocation, upload.single('image'), async (req, res) => {
  try {
    const { title, description, category, status } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Title, description, and category are required' });
    }

    const locationId = req.body.location || req.effectiveLocationId;
    if (!locationId) {
      return res.status(400).json({ message: 'Location is required' });
    }

    const bookData = {
      title,
      description,
      category,
      status: status || 'available',
      location: locationId,
    };

    if (req.file) {
      bookData.image = `/uploads/${req.file.filename}`;
    }

    const book = await Book.create(bookData);
    const populated = await book.populate([
      { path: 'category', select: 'name' },
      { path: 'location', select: 'name' },
    ]);
    res.status(201).json(populated);

    logAction(req, {
      action: 'create',
      entityType: 'book',
      entityId: book._id,
      details: `Created book "${title}"`,
      location: locationId,
    }).catch(console.error);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/books/bulk-import - admin
router.post('/bulk-import', auth, resolveLocation, async (req, res) => {
  try {
    const { books: bookRows } = req.body;

    if (!Array.isArray(bookRows) || bookRows.length === 0) {
      return res.status(400).json({ message: 'No books provided' });
    }

    if (bookRows.length > 500) {
      return res.status(400).json({ message: 'Maximum 500 books per import' });
    }

    const Category = require('../models/Category');
    const Location = require('../models/Location');

    // Build lookup maps for categories and locations by name (case-insensitive)
    const categories = await Category.find().lean();
    const categoryMap = {};
    for (const c of categories) {
      categoryMap[c.name.toLowerCase().trim()] = c._id;
    }

    const locations = await Location.find().lean();
    const locationMap = {};
    for (const l of locations) {
      locationMap[l.name.toLowerCase().trim()] = l._id;
    }

    const results = { created: 0, errors: [] };

    for (let i = 0; i < bookRows.length; i++) {
      const row = bookRows[i];
      const rowNum = i + 1;

      const title = (row.title || '').trim();
      const description = (row.description || '').trim();
      const categoryName = (row.category || '').trim();
      const locationName = (row.location || '').trim();

      if (!title) {
        results.errors.push({ row: rowNum, message: 'Title is required' });
        continue;
      }
      if (!description) {
        results.errors.push({ row: rowNum, message: `Description is required for "${title}"` });
        continue;
      }

      // Resolve category
      const categoryId = categoryMap[categoryName.toLowerCase()];
      if (!categoryId) {
        results.errors.push({ row: rowNum, message: `Category "${categoryName}" not found for "${title}"` });
        continue;
      }

      // Resolve location: use provided name, fall back to admin's location
      let locationId;
      if (locationName) {
        locationId = locationMap[locationName.toLowerCase()];
        if (!locationId) {
          results.errors.push({ row: rowNum, message: `Location "${locationName}" not found for "${title}"` });
          continue;
        }
      } else {
        locationId = req.effectiveLocationId;
      }

      // Location admins can only import to their own location
      if (req.adminRole !== 'super_admin' && locationId && locationId.toString() !== req.effectiveLocationId) {
        results.errors.push({ row: rowNum, message: `Not authorized to add books to this location for "${title}"` });
        continue;
      }

      if (!locationId) {
        results.errors.push({ row: rowNum, message: `Location is required for "${title}"` });
        continue;
      }

      try {
        await Book.create({
          title,
          description,
          category: categoryId,
          location: locationId,
          status: 'available',
        });
        results.created++;
      } catch (err) {
        results.errors.push({ row: rowNum, message: `Failed to create "${title}": ${err.message}` });
      }
    }

    logAction(req, {
      action: 'create',
      entityType: 'book',
      details: `Bulk imported ${results.created} book(s)${results.errors.length ? `, ${results.errors.length} error(s)` : ''}`,
    }).catch(console.error);

    res.json(results);
  } catch (error) {
    console.error('Bulk import error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/books/:id - admin
router.put('/:id', auth, resolveLocation, upload.single('image'), async (req, res) => {
  try {
    const { title, description, category, status } = req.body;
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Location admin can only edit books in their location
    if (req.adminRole !== 'super_admin' && book.location.toString() !== req.effectiveLocationId) {
      return res.status(403).json({ message: 'Not authorized for this location' });
    }

    if (title) book.title = title;
    if (description) book.description = description;
    if (category) book.category = category;
    if (status) book.status = status;

    if (req.file) {
      // Remove old image if exists
      if (book.image) {
        const oldPath = path.join(__dirname, '..', book.image);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      book.image = `/uploads/${req.file.filename}`;
    }

    await book.save();
    const populated = await book.populate([
      { path: 'category', select: 'name' },
      { path: 'location', select: 'name' },
    ]);
    res.json(populated);

    logAction(req, {
      action: 'update',
      entityType: 'book',
      entityId: book._id,
      details: `Updated book "${book.title}"`,
      location: book.location,
    }).catch(console.error);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/books/:id - admin
router.delete('/:id', auth, resolveLocation, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Location admin can only delete books in their location
    if (req.adminRole !== 'super_admin' && book.location.toString() !== req.effectiveLocationId) {
      return res.status(403).json({ message: 'Not authorized for this location' });
    }

    // Remove image file
    if (book.image) {
      const imgPath = path.join(__dirname, '..', book.image);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }
    }

    const bookTitle = book.title;
    const bookLocation = book.location;
    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: 'Book deleted' });

    logAction(req, {
      action: 'delete',
      entityType: 'book',
      entityId: book._id,
      details: `Deleted book "${bookTitle}"`,
      location: bookLocation,
    }).catch(console.error);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

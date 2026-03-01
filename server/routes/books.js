const express = require('express');
const Book = require('../models/Book');
const Reservation = require('../models/Reservation');
const auth = require('../middleware/auth');
const { resolveLocation } = require('../middleware/roles');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

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
  } catch (error) {
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

    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: 'Book deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

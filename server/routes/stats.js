const express = require('express');
const Book = require('../models/Book');
const Reservation = require('../models/Reservation');
const Category = require('../models/Category');
const auth = require('../middleware/auth');
const { resolveLocation } = require('../middleware/roles');

const router = express.Router();

// GET /api/stats - admin dashboard
router.get('/', auth, resolveLocation, async (req, res) => {
  try {
    const bookFilter = {};
    const reservationFilter = {};

    if (req.effectiveLocationId) {
      bookFilter.location = req.effectiveLocationId;
      reservationFilter.location = req.effectiveLocationId;
    }

    const [
      totalBooks,
      availableBooks,
      reservedBooks,
      borrowedBooks,
      totalReservations,
      categories,
      borrowedReservations,
    ] = await Promise.all([
      Book.countDocuments(bookFilter),
      Book.countDocuments({ ...bookFilter, status: 'available' }),
      Book.countDocuments({ ...bookFilter, status: 'reserved' }),
      Book.countDocuments({ ...bookFilter, status: 'borrowed' }),
      Reservation.countDocuments(reservationFilter),
      Category.find().lean(),
      Reservation.find({ ...reservationFilter, status: 'collected' })
        .populate('bookId', 'title')
        .sort({ returnDate: 1 })
        .lean(),
    ]);

    // Books per category
    const booksPerCategory = await Promise.all(
      categories.map(async (cat) => ({
        name: cat.name,
        count: await Book.countDocuments({ ...bookFilter, category: cat._id }),
      }))
    );

    res.json({
      totalBooks,
      availableBooks,
      reservedBooks,
      borrowedBooks,
      totalReservations,
      booksPerCategory,
      borrowedReservations,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

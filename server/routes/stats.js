const express = require('express');
const Book = require('../models/Book');
const Reservation = require('../models/Reservation');
const Category = require('../models/Category');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/stats - admin dashboard
router.get('/', auth, async (req, res) => {
  try {
    const [
      totalBooks,
      availableBooks,
      reservedBooks,
      borrowedBooks,
      totalReservations,
      categories,
      borrowedReservations,
    ] = await Promise.all([
      Book.countDocuments(),
      Book.countDocuments({ status: 'available' }),
      Book.countDocuments({ status: 'reserved' }),
      Book.countDocuments({ status: 'borrowed' }),
      Reservation.countDocuments(),
      Category.find().lean(),
      Reservation.find({ status: 'collected' })
        .populate('bookId', 'title')
        .sort({ returnDate: 1 })
        .lean(),
    ]);

    // Books per category
    const booksPerCategory = await Promise.all(
      categories.map(async (cat) => ({
        name: cat.name,
        count: await Book.countDocuments({ category: cat._id }),
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

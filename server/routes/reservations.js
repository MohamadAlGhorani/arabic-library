const express = require('express');
const Reservation = require('../models/Reservation');
const Book = require('../models/Book');
const auth = require('../middleware/auth');
const { sendPickupReminder, sendReturnReminder } = require('../services/email');

const router = express.Router();

// POST /api/reservations - public
router.post('/', async (req, res) => {
  try {
    const { bookId, name, email, phone, date, time } = req.body;

    if (!bookId || !name || !email || !date || !time) {
      return res.status(400).json({ message: 'Name, email, date and time are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (book.status !== 'available') {
      return res.status(400).json({ message: 'Book is not available for reservation' });
    }

    const reservation = await Reservation.create({
      bookId,
      name,
      email,
      phone: phone || '',
      date,
      time,
    });

    // Update book status to reserved
    book.status = 'reserved';
    await book.save();

    res.status(201).json({
      message: 'Your reservation has been received. Please come at the selected time to collect your book.',
      reservation,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/reservations - admin
router.get('/', auth, async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate({
        path: 'bookId',
        select: 'title category status',
        populate: { path: 'category', select: 'name' },
      })
      .sort({ createdAt: -1 });

    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/reservations/:id - admin (change status)
router.put('/:id', auth, async (req, res) => {
  try {
    const { status, returnDate } = req.body;

    if (!status || !['collected', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Status must be collected, completed, or cancelled' });
    }

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    reservation.status = status;

    if (status === 'collected') {
      // Require return date when collecting
      if (!returnDate) {
        return res.status(400).json({ message: 'Return date is required when marking as collected' });
      }
      reservation.returnDate = returnDate;
      reservation.collectedAt = new Date().toISOString().split('T')[0];
      reservation.returnReminderSent = false;
      await Book.findByIdAndUpdate(reservation.bookId, { status: 'borrowed' });
    }

    if (status === 'completed' || status === 'cancelled') {
      reservation.returnDate = '';
      await Book.findByIdAndUpdate(reservation.bookId, { status: 'available' });
    }

    await reservation.save();

    const updated = await Reservation.findById(req.params.id).populate({
      path: 'bookId',
      select: 'title category status',
      populate: { path: 'category', select: 'name' },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/reservations/:id/extend - admin (extend return date)
router.put('/:id/extend', auth, async (req, res) => {
  try {
    const { returnDate } = req.body;

    if (!returnDate) {
      return res.status(400).json({ message: 'New return date is required' });
    }

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (reservation.status !== 'collected') {
      return res.status(400).json({ message: 'Can only extend return date for collected (borrowed) reservations' });
    }

    reservation.returnDate = returnDate;
    reservation.returnReminderSent = false;
    await reservation.save();

    const updated = await Reservation.findById(req.params.id).populate({
      path: 'bookId',
      select: 'title category status',
      populate: { path: 'category', select: 'name' },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/reservations/:id/remind - admin sends reminder email manually
router.post('/:id/remind', auth, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate({
      path: 'bookId',
      select: 'title',
    });

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (!['pending', 'collected'].includes(reservation.status)) {
      return res.status(400).json({ message: 'Can only send reminders for pending or collected reservations' });
    }

    if (reservation.status === 'pending') {
      await sendPickupReminder({
        to: reservation.email,
        name: reservation.name,
        bookTitle: reservation.bookId?.title || 'Unknown',
        date: reservation.date,
        time: reservation.time,
      });
      reservation.reminderSent = true;
    } else {
      await sendReturnReminder({
        to: reservation.email,
        name: reservation.name,
        bookTitle: reservation.bookId?.title || 'Unknown',
        returnDate: reservation.returnDate,
      });
      reservation.returnReminderSent = true;
    }

    await reservation.save();

    res.json({ message: 'Reminder email sent successfully' });
  } catch (error) {
    console.error('Email error:', error.message);
    res.status(500).json({ message: 'Failed to send reminder email' });
  }
});

module.exports = router;

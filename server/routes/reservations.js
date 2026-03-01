const express = require('express');
const Reservation = require('../models/Reservation');
const Book = require('../models/Book');
const auth = require('../middleware/auth');
const { resolveLocation } = require('../middleware/roles');
const { sendPickupReminder, sendReturnReminder, sendReservationConfirmation, sendCollectionConfirmation, sendCancellationNotice } = require('../services/email');

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
      location: book.location,
    });

    // Update book status to reserved
    book.status = 'reserved';
    await book.save();

    // Send confirmation email (non-blocking — don't fail the reservation if email fails)
    const populatedBook = await Book.findById(bookId).populate('location', 'name');
    sendReservationConfirmation({
      to: email,
      name,
      bookTitle: book.title,
      date,
      time,
      locationName: populatedBook?.location?.name || '',
    }).catch((err) => console.error('Failed to send confirmation email:', err.message));

    res.status(201).json({
      message: 'Your reservation has been received. Please come at the selected time to collect your book.',
      reservation,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/reservations - admin
router.get('/', auth, resolveLocation, async (req, res) => {
  try {
    const filter = {};
    if (req.effectiveLocationId) {
      filter.location = req.effectiveLocationId;
    }

    const reservations = await Reservation.find(filter)
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
router.put('/:id', auth, resolveLocation, async (req, res) => {
  try {
    const { status, returnDate } = req.body;

    if (!status || !['collected', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Status must be collected, completed, or cancelled' });
    }

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Location admin can only manage their own location's reservations
    if (req.adminRole !== 'super_admin' && reservation.location.toString() !== req.effectiveLocationId) {
      return res.status(403).json({ message: 'Not authorized for this location' });
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

    // Send status notification emails (non-blocking)
    if (reservation.email && (status === 'collected' || status === 'cancelled')) {
      const bookForEmail = await Book.findById(reservation.bookId)
        .select('title')
        .populate('location', 'name');

      if (status === 'collected') {
        sendCollectionConfirmation({
          to: reservation.email,
          name: reservation.name,
          bookTitle: bookForEmail?.title || 'Unknown',
          returnDate,
          locationName: bookForEmail?.location?.name || '',
        }).catch((err) => console.error('Failed to send collection email:', err.message));
      } else if (status === 'cancelled') {
        sendCancellationNotice({
          to: reservation.email,
          name: reservation.name,
          bookTitle: bookForEmail?.title || 'Unknown',
          locationName: bookForEmail?.location?.name || '',
        }).catch((err) => console.error('Failed to send cancellation email:', err.message));
      }
    }

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
router.put('/:id/extend', auth, resolveLocation, async (req, res) => {
  try {
    const { returnDate } = req.body;

    if (!returnDate) {
      return res.status(400).json({ message: 'New return date is required' });
    }

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Location admin can only extend their own location's reservations
    if (req.adminRole !== 'super_admin' && reservation.location.toString() !== req.effectiveLocationId) {
      return res.status(403).json({ message: 'Not authorized for this location' });
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
router.post('/:id/remind', auth, resolveLocation, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate({ path: 'bookId', select: 'title' })
      .populate({ path: 'location', select: 'name' });

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Location admin can only send reminders for their own location's reservations
    if (req.adminRole !== 'super_admin' && reservation.location?._id?.toString() !== req.effectiveLocationId) {
      return res.status(403).json({ message: 'Not authorized for this location' });
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
        locationName: reservation.location?.name || '',
      });
      reservation.reminderSent = true;
    } else {
      await sendReturnReminder({
        to: reservation.email,
        name: reservation.name,
        bookTitle: reservation.bookId?.title || 'Unknown',
        returnDate: reservation.returnDate,
        locationName: reservation.location?.name || '',
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

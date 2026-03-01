const express = require('express');
const Reservation = require('../models/Reservation');
const Book = require('../models/Book');
const auth = require('../middleware/auth');
const { resolveLocation } = require('../middleware/roles');
const Admin = require('../models/Admin');
const { sendPickupReminder, sendReturnReminder, sendReservationConfirmation, sendCollectionConfirmation, sendCancellationNotice, sendNewReservationNotification, sendAdminPickupNotification, sendAdminReturnNotification, sendReturnExtensionNotice, sendReturnConfirmation } = require('../services/email');

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
    const locationName = populatedBook?.location?.name || '';

    sendReservationConfirmation({
      to: email,
      name,
      bookTitle: book.title,
      date,
      time,
      locationName,
    }).catch((err) => console.error('Failed to send confirmation email:', err.message));

    // Notify admins of the new reservation (non-blocking)
    Admin.find({
      isActive: true,
      email: { $ne: '' },
      $or: [
        { role: 'super_admin' },
        { role: 'location_admin', location: book.location },
      ],
    }).select('email').then((admins) => {
      const adminEmails = admins.map((a) => a.email).filter(Boolean);
      if (adminEmails.length > 0) {
        sendNewReservationNotification({
          to: adminEmails.join(','),
          bookTitle: book.title,
          customerName: name,
          customerEmail: email,
          customerPhone: phone || '',
          date,
          time,
          locationName,
        }).catch((err) => console.error('Failed to send admin notification email:', err.message));
      }
    }).catch((err) => console.error('Failed to query admins for notification:', err.message));

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
    if (reservation.email) {
      const bookForEmail = await Book.findById(reservation.bookId)
        .select('title')
        .populate('location', 'name');
      const bookTitle = bookForEmail?.title || 'Unknown';
      const locationName = bookForEmail?.location?.name || '';

      if (status === 'collected') {
        sendCollectionConfirmation({
          to: reservation.email,
          name: reservation.name,
          bookTitle,
          returnDate,
          locationName,
        }).catch((err) => console.error('Failed to send collection email:', err.message));
      } else if (status === 'completed') {
        sendReturnConfirmation({
          to: reservation.email,
          name: reservation.name,
          bookTitle,
          locationName,
        }).catch((err) => console.error('Failed to send return confirmation email:', err.message));
      } else if (status === 'cancelled') {
        sendCancellationNotice({
          to: reservation.email,
          name: reservation.name,
          bookTitle,
          locationName,
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

    // Notify customer of extended return date (non-blocking)
    if (reservation.email) {
      const bookForEmail = await Book.findById(reservation.bookId)
        .select('title')
        .populate('location', 'name');

      sendReturnExtensionNotice({
        to: reservation.email,
        name: reservation.name,
        bookTitle: bookForEmail?.title || 'Unknown',
        newReturnDate: returnDate,
        locationName: bookForEmail?.location?.name || '',
      }).catch((err) => console.error('Failed to send return extension email:', err.message));
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

    const bookTitle = reservation.bookId?.title || 'Unknown';
    const locationName = reservation.location?.name || '';
    const locationId = reservation.location?._id;

    if (reservation.status === 'pending') {
      await sendPickupReminder({
        to: reservation.email,
        name: reservation.name,
        bookTitle,
        date: reservation.date,
        time: reservation.time,
        locationName,
      });
      reservation.reminderSent = true;

      // Also notify admins (non-blocking)
      Admin.find({
        isActive: true,
        email: { $ne: '' },
        $or: [
          { role: 'super_admin' },
          { role: 'location_admin', location: locationId },
        ],
      }).select('email').then((admins) => {
        const adminEmails = admins.map((a) => a.email).filter(Boolean);
        if (adminEmails.length > 0) {
          sendAdminPickupNotification({
            to: adminEmails.join(','),
            customerName: reservation.name,
            customerEmail: reservation.email,
            customerPhone: reservation.phone || '',
            bookTitle,
            date: reservation.date,
            time: reservation.time,
            locationName,
          }).catch((err) => console.error('Failed to send admin pickup notification:', err.message));
        }
      }).catch((err) => console.error('Failed to query admins for notification:', err.message));
    } else {
      await sendReturnReminder({
        to: reservation.email,
        name: reservation.name,
        bookTitle,
        returnDate: reservation.returnDate,
        locationName,
      });
      reservation.returnReminderSent = true;

      // Also notify admins (non-blocking)
      Admin.find({
        isActive: true,
        email: { $ne: '' },
        $or: [
          { role: 'super_admin' },
          { role: 'location_admin', location: locationId },
        ],
      }).select('email').then((admins) => {
        const adminEmails = admins.map((a) => a.email).filter(Boolean);
        if (adminEmails.length > 0) {
          sendAdminReturnNotification({
            to: adminEmails.join(','),
            customerName: reservation.name,
            customerEmail: reservation.email,
            customerPhone: reservation.phone || '',
            bookTitle,
            returnDate: reservation.returnDate,
            locationName,
          }).catch((err) => console.error('Failed to send admin return notification:', err.message));
        }
      }).catch((err) => console.error('Failed to query admins for notification:', err.message));
    }

    await reservation.save();

    res.json({ message: 'Reminder email sent successfully' });
  } catch (error) {
    console.error('Email error:', error.message);
    res.status(500).json({ message: 'Failed to send reminder email' });
  }
});

module.exports = router;

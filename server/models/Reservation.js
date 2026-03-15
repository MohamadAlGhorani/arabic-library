const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book is required'],
  },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: [true, 'Location is required'],
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  date: {
    type: String,
    required: [true, 'Date is required'],
  },
  time: {
    type: String,
    required: [true, 'Time slot is required'],
  },
  status: {
    type: String,
    enum: ['pending', 'collected', 'completed', 'cancelled'],
    default: 'pending',
  },
  reminderSent: {
    type: Boolean,
    default: false,
  },
  returnDate: {
    type: String,
    default: '',
  },
  returnReminderSent: {
    type: Boolean,
    default: false,
  },
  collectedAt: {
    type: String,
    default: '',
  },
  overdueReminderCount: {
    type: Number,
    default: 0,
  },
  confirmationCode: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('Reservation', reservationSchema);

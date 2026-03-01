const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: [true, 'Location is required'],
    unique: true,
  },
  // Days of the week the library is open (0=Sunday, 1=Monday, ..., 6=Saturday)
  openDays: {
    type: [Number],
    default: [1, 2, 3, 4, 5], // Mon-Fri
  },
  // Available time slots for pickup
  timeSlots: {
    type: [String],
    default: [
      '09:00 - 10:00',
      '10:00 - 11:00',
      '11:00 - 12:00',
      '12:00 - 13:00',
      '13:00 - 14:00',
      '14:00 - 15:00',
      '15:00 - 16:00',
      '16:00 - 17:00',
    ],
  },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);

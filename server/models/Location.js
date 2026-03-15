const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Location name is required'],
    trim: true,
  },
  address: {
    type: String,
    default: '',
    trim: true,
  },
  phone: {
    type: String,
    default: '',
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  image: {
    type: String,
    default: '',
  },
  lat: {
    type: Number,
    default: null,
  },
  lng: {
    type: Number,
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('Location', locationSchema);

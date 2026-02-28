const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Book description is required'],
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
  },
  image: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['available', 'reserved', 'borrowed'],
    default: 'available',
  },
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);

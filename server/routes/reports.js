const express = require('express');
const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const Book = require('../models/Book');
const auth = require('../middleware/auth');
const { resolveLocation } = require('../middleware/roles');

const router = express.Router();

// GET /api/reports - all admins
router.get('/', auth, resolveLocation, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const reservationFilter = {};
    const bookFilter = {};

    if (req.effectiveLocationId) {
      reservationFilter.location = new mongoose.Types.ObjectId(req.effectiveLocationId);
      bookFilter.location = new mongoose.Types.ObjectId(req.effectiveLocationId);
    }

    if (startDate || endDate) {
      reservationFilter.createdAt = {};
      if (startDate) reservationFilter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        reservationFilter.createdAt.$lte = end;
      }
    }

    // Build match stage for aggregations
    const matchStage = { ...reservationFilter };

    const [
      mostBorrowed,
      busiestDays,
      busiestTimeSlots,
      overdueBooks,
      statusBreakdown,
      categoryPopularity,
    ] = await Promise.all([
      // 1. Most Borrowed Books
      Reservation.aggregate([
        { $match: { ...matchStage, status: { $in: ['collected', 'completed'] } } },
        { $group: { _id: '$bookId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
        {
          $lookup: {
            from: 'books',
            localField: '_id',
            foreignField: '_id',
            as: 'book',
          },
        },
        { $unwind: '$book' },
        {
          $lookup: {
            from: 'categories',
            localField: 'book.category',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            bookId: '$_id',
            title: '$book.title',
            category: '$category.name',
            count: 1,
          },
        },
      ]),

      // 2. Busiest Days
      Reservation.aggregate([
        { $match: matchStage },
        { $group: { _id: '$date', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
        { $project: { _id: 0, date: '$_id', count: 1 } },
      ]),

      // 3. Busiest Time Slots
      Reservation.aggregate([
        { $match: matchStage },
        { $group: { _id: '$time', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { _id: 0, timeSlot: '$_id', count: 1 } },
      ]),

      // 4. Overdue Books
      (() => {
        const today = new Date().toISOString().split('T')[0];
        const overdueFilter = {
          status: 'collected',
          returnDate: { $ne: '', $lt: today },
        };
        if (req.effectiveLocationId) {
          overdueFilter.location = req.effectiveLocationId;
        }
        return Reservation.find(overdueFilter)
          .populate('bookId', 'title')
          .populate('location', 'name')
          .sort({ returnDate: 1 })
          .lean();
      })(),

      // 5. Reservation Status Breakdown
      Reservation.aggregate([
        { $match: matchStage },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { _id: 0, status: '$_id', count: 1 } },
      ]),

      // 6. Category Popularity
      Reservation.aggregate([
        { $match: { ...matchStage, status: { $in: ['collected', 'completed'] } } },
        {
          $lookup: {
            from: 'books',
            localField: 'bookId',
            foreignField: '_id',
            as: 'book',
          },
        },
        { $unwind: '$book' },
        {
          $lookup: {
            from: 'categories',
            localField: 'book.category',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$category.name', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { _id: 0, category: '$_id', count: 1 } },
      ]),
    ]);

    res.json({
      mostBorrowed,
      busiestDays,
      busiestTimeSlots,
      overdueBooks,
      statusBreakdown,
      categoryPopularity,
    });
  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

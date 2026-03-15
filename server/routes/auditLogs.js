const express = require('express');
const AuditLog = require('../models/AuditLog');
const auth = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/roles');

const router = express.Router();

// GET /api/audit-logs - super admin only
router.get('/', auth, requireSuperAdmin, async (req, res) => {
  try {
    const {
      search,
      action,
      entityType,
      startDate,
      endDate,
      locationId,
      page = 1,
      limit = 25,
    } = req.query;

    const filter = {};

    if (search) {
      filter.adminName = { $regex: search, $options: 'i' };
    }

    if (action) {
      filter.action = action;
    }

    if (entityType) {
      filter.entityType = entityType;
    }

    if (locationId) {
      filter.location = locationId;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('location', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      logs,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('Audit log fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

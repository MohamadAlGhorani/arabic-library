const express = require('express');
const Settings = require('../models/Settings');
const auth = require('../middleware/auth');

const router = express.Router();

// Helper: get or create settings (singleton)
const getOrCreateSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
};

// GET /api/settings - public (reservation form needs this)
router.get('/', async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/settings - admin only
router.put('/', auth, async (req, res) => {
  try {
    const { openDays, timeSlots } = req.body;

    const settings = await getOrCreateSettings();

    if (openDays !== undefined) {
      // Validate: must be array of numbers 0-6
      if (!Array.isArray(openDays) || openDays.some((d) => d < 0 || d > 6)) {
        return res.status(400).json({ message: 'openDays must be an array of numbers 0-6' });
      }
      settings.openDays = openDays;
    }

    if (timeSlots !== undefined) {
      if (!Array.isArray(timeSlots) || timeSlots.length === 0) {
        return res.status(400).json({ message: 'At least one time slot is required' });
      }
      settings.timeSlots = timeSlots;
    }

    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

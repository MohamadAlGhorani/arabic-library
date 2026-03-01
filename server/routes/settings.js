const express = require('express');
const Settings = require('../models/Settings');
const auth = require('../middleware/auth');
const { resolveLocation } = require('../middleware/roles');

const router = express.Router();

// Helper: get or create settings for a location
const getOrCreateSettings = async (locationId) => {
  let settings = await Settings.findOne({ location: locationId });
  if (!settings) {
    settings = await Settings.create({ location: locationId });
  }
  return settings;
};

// GET /api/settings - public (reservation form needs this)
router.get('/', async (req, res) => {
  try {
    const { locationId } = req.query;
    if (!locationId) {
      return res.status(400).json({ message: 'locationId query parameter is required' });
    }

    const settings = await getOrCreateSettings(locationId);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/settings - admin only
router.put('/', auth, resolveLocation, async (req, res) => {
  try {
    const { openDays, timeSlots } = req.body;
    const locationId = req.body.locationId || req.effectiveLocationId;

    if (!locationId) {
      return res.status(400).json({ message: 'Location is required' });
    }

    // Location admin can only update their own location's settings
    if (req.adminRole !== 'super_admin' && locationId !== req.effectiveLocationId) {
      return res.status(403).json({ message: 'Not authorized for this location' });
    }

    const settings = await getOrCreateSettings(locationId);

    if (openDays !== undefined) {
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

const express = require('express');
const Location = require('../models/Location');
const Book = require('../models/Book');
const Settings = require('../models/Settings');
const auth = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/roles');
const upload = require('../middleware/upload');
const { logAction } = require('../services/auditLog');

const router = express.Router();

// GET /api/locations - public (used by Home page filter dropdown)
router.get('/', async (req, res) => {
  try {
    const locations = await Location.find().sort({ name: 1 });
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/locations - super admin only
router.post('/', auth, requireSuperAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, address, phone, description, lat, lng } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Location name is required' });
    }

    const locationData = {
      name,
      address: address || '',
      phone: phone || '',
      description: description || '',
      lat: lat !== undefined && lat !== '' ? parseFloat(lat) : null,
      lng: lng !== undefined && lng !== '' ? parseFloat(lng) : null,
    };

    if (req.file) {
      locationData.image = upload.toDataUri(req.file);
    }

    const location = await Location.create(locationData);

    // Auto-create default settings for this location
    await Settings.create({ location: location._id });

    res.status(201).json(location);

    logAction(req, {
      action: 'create',
      entityType: 'location',
      entityId: location._id,
      details: `Created location "${name}"`,
      location: location._id,
    }).catch(console.error);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/locations/:id - super admin only
router.put('/:id', auth, requireSuperAdmin, upload.single('image'), async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    const { name, address, phone, description, lat, lng } = req.body;
    if (name) location.name = name;
    if (address !== undefined) location.address = address;
    if (phone !== undefined) location.phone = phone;
    if (description !== undefined) location.description = description;
    if (lat !== undefined) location.lat = lat !== '' ? parseFloat(lat) : null;
    if (lng !== undefined) location.lng = lng !== '' ? parseFloat(lng) : null;

    if (req.file) {
      location.image = upload.toDataUri(req.file);
    }

    await location.save();
    res.json(location);

    logAction(req, {
      action: 'update',
      entityType: 'location',
      entityId: location._id,
      details: `Updated location "${location.name}"`,
      location: location._id,
    }).catch(console.error);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/locations/:id - super admin only
router.delete('/:id', auth, requireSuperAdmin, async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    const booksCount = await Book.countDocuments({ location: req.params.id });
    if (booksCount > 0) {
      return res.status(400).json({
        message: `Cannot delete: ${booksCount} book(s) belong to this location`,
      });
    }

    // Delete location settings
    await Settings.deleteOne({ location: req.params.id });

    const locationName = location.name;
    await Location.findByIdAndDelete(req.params.id);
    res.json({ message: 'Location deleted' });

    logAction(req, {
      action: 'delete',
      entityType: 'location',
      entityId: location._id,
      details: `Deleted location "${locationName}"`,
    }).catch(console.error);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

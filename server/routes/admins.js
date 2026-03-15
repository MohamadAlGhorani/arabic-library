const express = require('express');
const Admin = require('../models/Admin');
const auth = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/roles');
const { logAction } = require('../services/auditLog');

const router = express.Router();

// GET /api/admins - super admin only, list all admins
router.get('/', auth, requireSuperAdmin, async (req, res) => {
  try {
    const { role, location, search, isActive } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (location) filter.location = location;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const admins = await Admin.find(filter)
      .select('-password')
      .populate('location', 'name')
      .sort({ createdAt: -1 });

    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admins - super admin only, create admin
router.post('/', auth, requireSuperAdmin, async (req, res) => {
  try {
    const { username, password, role, location, fullName, email, phone } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check unique username
    const existing = await Admin.findOne({ username });
    if (existing) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Validate role + location combo
    const adminRole = role || 'location_admin';
    if (adminRole === 'location_admin' && !location) {
      return res.status(400).json({ message: 'Location is required for location admins' });
    }

    const admin = await Admin.create({
      username,
      password,
      role: adminRole,
      location: adminRole === 'super_admin' ? null : location,
      fullName: fullName || '',
      email: email || '',
      phone: phone || '',
    });

    const created = await Admin.findById(admin._id)
      .select('-password')
      .populate('location', 'name');

    res.status(201).json(created);

    logAction(req, {
      action: 'create',
      entityType: 'admin',
      entityId: admin._id,
      details: `Created admin "${username}" (${adminRole})`,
      location: adminRole === 'super_admin' ? null : location,
    }).catch(console.error);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admins/:id - super admin only, update admin
router.put('/:id', auth, requireSuperAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const { username, password, role, location, fullName, email, phone } = req.body;

    // Check unique username if changed
    if (username && username !== admin.username) {
      const existing = await Admin.findOne({ username });
      if (existing) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      admin.username = username;
    }

    // Update password only if provided
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      admin.password = password;
    }

    if (role) {
      admin.role = role;
      if (role === 'super_admin') {
        admin.location = null;
      } else if (location) {
        admin.location = location;
      }
    } else if (location !== undefined) {
      admin.location = location || null;
    }

    if (fullName !== undefined) admin.fullName = fullName;
    if (email !== undefined) admin.email = email;
    if (phone !== undefined) admin.phone = phone;

    await admin.save();

    const updated = await Admin.findById(admin._id)
      .select('-password')
      .populate('location', 'name');

    res.json(updated);

    logAction(req, {
      action: 'update',
      entityType: 'admin',
      entityId: admin._id,
      details: `Updated admin "${admin.username}"`,
      location: admin.location,
    }).catch(console.error);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admins/:id/toggle - super admin only, toggle active/inactive
router.put('/:id/toggle', auth, requireSuperAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Prevent deactivating yourself
    if (admin._id.toString() === req.adminId) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    admin.isActive = !admin.isActive;
    await admin.save();

    const updated = await Admin.findById(admin._id)
      .select('-password')
      .populate('location', 'name');

    res.json(updated);

    logAction(req, {
      action: 'toggle',
      entityType: 'admin',
      entityId: admin._id,
      details: `${admin.isActive ? 'Activated' : 'Deactivated'} admin "${admin.username}"`,
      location: admin.location,
    }).catch(console.error);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admins/:id - super admin only
router.delete('/:id', auth, requireSuperAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Prevent deleting yourself
    if (admin._id.toString() === req.adminId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Prevent deleting the last super admin
    if (admin.role === 'super_admin') {
      const superAdminCount = await Admin.countDocuments({ role: 'super_admin' });
      if (superAdminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last super admin' });
      }
    }

    const adminUsername = admin.username;
    const adminLocation = admin.location;
    await Admin.findByIdAndDelete(req.params.id);
    res.json({ message: 'Admin deleted' });

    logAction(req, {
      action: 'delete',
      entityType: 'admin',
      entityId: admin._id,
      details: `Deleted admin "${adminUsername}"`,
      location: adminLocation,
    }).catch(console.error);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

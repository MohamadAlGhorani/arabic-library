const AuditLog = require('../models/AuditLog');
const Admin = require('../models/Admin');

async function logAction(req, { action, entityType, entityId, details, location }) {
  const adminId = req.adminId;
  if (!adminId) return;

  let adminName = 'Unknown';
  try {
    const admin = await Admin.findById(adminId).select('fullName username').lean();
    if (admin) {
      adminName = admin.fullName || admin.username;
    }
  } catch (err) {
    // Fall through with 'Unknown'
  }

  await AuditLog.create({
    admin: adminId,
    adminName,
    action,
    entityType,
    entityId: entityId || undefined,
    details,
    location: location || req.effectiveLocationId || req.adminLocationId || undefined,
  });
}

module.exports = { logAction };

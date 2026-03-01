/**
 * Only allows super_admin to proceed.
 * Must be used AFTER auth middleware.
 */
const requireSuperAdmin = (req, res, next) => {
  if (req.adminRole !== 'super_admin') {
    return res.status(403).json({ message: 'Super admin access required' });
  }
  next();
};

/**
 * Resolves the "effective location" for the current request.
 * - Super admins: use query/body locationId (or null for "all locations")
 * - Location admins: always forced to their own location
 *
 * Sets req.effectiveLocationId (string | null).
 */
const resolveLocation = (req, res, next) => {
  if (req.adminRole === 'super_admin') {
    req.effectiveLocationId = req.query.locationId || req.body.locationId || null;
  } else {
    req.effectiveLocationId = req.adminLocationId;
  }
  next();
};

module.exports = { requireSuperAdmin, resolveLocation };

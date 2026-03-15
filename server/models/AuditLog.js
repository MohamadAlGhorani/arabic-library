const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    adminName: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'status_change', 'toggle', 'login'],
      required: true,
    },
    entityType: {
      type: String,
      enum: ['book', 'reservation', 'category', 'location', 'admin', 'settings', 'page'],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    details: {
      type: String,
      required: true,
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ admin: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

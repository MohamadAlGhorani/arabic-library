const cron = require('node-cron');
const Reservation = require('../models/Reservation');
const Book = require('../models/Book');
const Admin = require('../models/Admin');
const { sendPickupReminder, sendReturnReminder, sendAdminPickupNotification, sendAdminReturnNotification } = require('./email');

/**
 * Get admin emails for a given location (location admins + all super admins).
 */
const getAdminEmails = async (locationId) => {
  const admins = await Admin.find({
    isActive: true,
    email: { $ne: '' },
    $or: [
      { role: 'super_admin' },
      { role: 'location_admin', location: locationId },
    ],
  }).select('email');
  return admins.map((a) => a.email).filter(Boolean);
};

/**
 * Runs every day at 9:00 AM.
 * 1. Sends pickup reminders for pending reservations due tomorrow (to customer + admins).
 * 2. Sends return reminders for collected (borrowed) books due back tomorrow (to customer + admins).
 */
const startReminderScheduler = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('[Scheduler] Checking for reminders to send...');

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // --- Pickup reminders (pending reservations for tomorrow) ---
      const pickupReservations = await Reservation.find({
        status: 'pending',
        date: tomorrowStr,
        reminderSent: false,
      })
        .populate({ path: 'bookId', select: 'title' })
        .populate({ path: 'location', select: 'name' });

      if (pickupReservations.length > 0) {
        console.log(`[Scheduler] Sending ${pickupReservations.length} pickup reminder(s)...`);
        for (const reservation of pickupReservations) {
          try {
            // Send to customer
            await sendPickupReminder({
              to: reservation.email,
              name: reservation.name,
              bookTitle: reservation.bookId?.title || 'Unknown',
              date: reservation.date,
              time: reservation.time,
              locationName: reservation.location?.name || '',
            });

            // Send to admins (non-blocking)
            getAdminEmails(reservation.location?._id).then((adminEmails) => {
              if (adminEmails.length > 0) {
                sendAdminPickupNotification({
                  to: adminEmails.join(','),
                  customerName: reservation.name,
                  customerEmail: reservation.email,
                  customerPhone: reservation.phone || '',
                  bookTitle: reservation.bookId?.title || 'Unknown',
                  date: reservation.date,
                  time: reservation.time,
                  locationName: reservation.location?.name || '',
                }).catch((err) => console.error(`[Scheduler] Failed to send admin pickup notification:`, err.message));
              }
            }).catch((err) => console.error(`[Scheduler] Failed to query admins:`, err.message));

            reservation.reminderSent = true;
            await reservation.save();
            console.log(`[Scheduler] Pickup reminder sent to ${reservation.email}`);
          } catch (err) {
            console.error(`[Scheduler] Failed to send pickup reminder to ${reservation.email}:`, err.message);
          }
        }
      }

      // --- Return reminders (collected books due back tomorrow) ---
      const returnReservations = await Reservation.find({
        status: 'collected',
        returnDate: tomorrowStr,
        returnReminderSent: false,
      })
        .populate({ path: 'bookId', select: 'title' })
        .populate({ path: 'location', select: 'name' });

      if (returnReservations.length > 0) {
        console.log(`[Scheduler] Sending ${returnReservations.length} return reminder(s)...`);
        for (const reservation of returnReservations) {
          try {
            // Send to customer
            await sendReturnReminder({
              to: reservation.email,
              name: reservation.name,
              bookTitle: reservation.bookId?.title || 'Unknown',
              returnDate: reservation.returnDate,
              locationName: reservation.location?.name || '',
            });

            // Send to admins (non-blocking)
            getAdminEmails(reservation.location?._id).then((adminEmails) => {
              if (adminEmails.length > 0) {
                sendAdminReturnNotification({
                  to: adminEmails.join(','),
                  customerName: reservation.name,
                  customerEmail: reservation.email,
                  customerPhone: reservation.phone || '',
                  bookTitle: reservation.bookId?.title || 'Unknown',
                  returnDate: reservation.returnDate,
                  locationName: reservation.location?.name || '',
                }).catch((err) => console.error(`[Scheduler] Failed to send admin return notification:`, err.message));
              }
            }).catch((err) => console.error(`[Scheduler] Failed to query admins:`, err.message));

            reservation.returnReminderSent = true;
            await reservation.save();
            console.log(`[Scheduler] Return reminder sent to ${reservation.email}`);
          } catch (err) {
            console.error(`[Scheduler] Failed to send return reminder to ${reservation.email}:`, err.message);
          }
        }
      }

      if (pickupReservations.length === 0 && returnReservations.length === 0) {
        console.log('[Scheduler] No reminders to send.');
      }
    } catch (error) {
      console.error('[Scheduler] Error:', error.message);
    }
  });

  console.log('Reminder scheduler started (runs daily at 9:00 AM)');
};

module.exports = { startReminderScheduler };

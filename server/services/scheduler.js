const cron = require('node-cron');
const Reservation = require('../models/Reservation');
const Book = require('../models/Book');
const { sendPickupReminder, sendReturnReminder } = require('./email');

/**
 * Runs every day at 9:00 AM.
 * 1. Sends pickup reminders for pending reservations due tomorrow.
 * 2. Sends return reminders for collected (borrowed) books due back tomorrow.
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
      }).populate({ path: 'bookId', select: 'title' });

      if (pickupReservations.length > 0) {
        console.log(`[Scheduler] Sending ${pickupReservations.length} pickup reminder(s)...`);
        for (const reservation of pickupReservations) {
          try {
            await sendPickupReminder({
              to: reservation.email,
              name: reservation.name,
              bookTitle: reservation.bookId?.title || 'Unknown',
              date: reservation.date,
              time: reservation.time,
            });
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
      }).populate({ path: 'bookId', select: 'title' });

      if (returnReservations.length > 0) {
        console.log(`[Scheduler] Sending ${returnReservations.length} return reminder(s)...`);
        for (const reservation of returnReservations) {
          try {
            await sendReturnReminder({
              to: reservation.email,
              name: reservation.name,
              bookTitle: reservation.bookId?.title || 'Unknown',
              returnDate: reservation.returnDate,
            });
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

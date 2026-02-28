const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send a pickup reminder email (for pending reservations due tomorrow).
 */
const sendPickupReminder = async ({ to, name, bookTitle, date, time }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; direction: rtl; text-align: right;">
      <div style="background: #059669; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">مكتبة الشباب العربي</h2>
        <p style="margin: 5px 0 0; opacity: 0.9;">Arabic Youth Library</p>
      </div>
      <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="color: #374151; font-size: 16px;">
          مرحباً <strong>${name}</strong>,
        </p>
        <p style="color: #374151;">
          هذا تذكير بأن موعد استلام الكتاب التالي غداً:
        </p>
        <div style="background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px; color: #111827;"><strong>الكتاب:</strong> ${bookTitle}</p>
          <p style="margin: 0 0 8px; color: #111827;"><strong>التاريخ:</strong> ${date}</p>
          <p style="margin: 0; color: #111827;"><strong>الوقت:</strong> ${time}</p>
        </div>
        <p style="color: #374151;">
          يرجى الحضور في الموعد المحدد لاستلام الكتاب. شكراً لك!
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #6b7280; font-size: 13px; direction: ltr; text-align: left;">
          <strong>Reminder:</strong> Please come to pick up the book "<em>${bookTitle}</em>"
          on <strong>${date}</strong> at <strong>${time}</strong>. Thank you!
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Arabic Youth Library" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Reminder: Pick up "${bookTitle}" - تذكير باستلام الكتاب`,
    html,
  });
};

/**
 * Send a return reminder email (for borrowed books due back tomorrow).
 */
const sendReturnReminder = async ({ to, name, bookTitle, returnDate }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; direction: rtl; text-align: right;">
      <div style="background: #059669; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">مكتبة الشباب العربي</h2>
        <p style="margin: 5px 0 0; opacity: 0.9;">Arabic Youth Library</p>
      </div>
      <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="color: #374151; font-size: 16px;">
          مرحباً <strong>${name}</strong>,
        </p>
        <p style="color: #374151;">
          هذا تذكير بأن موعد إعادة الكتاب التالي غداً:
        </p>
        <div style="background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px; color: #111827;"><strong>الكتاب:</strong> ${bookTitle}</p>
          <p style="margin: 0; color: #111827;"><strong>تاريخ الإرجاع:</strong> ${returnDate}</p>
        </div>
        <p style="color: #374151;">
          يرجى إعادة الكتاب في الموعد المحدد. شكراً لك!
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #6b7280; font-size: 13px; direction: ltr; text-align: left;">
          <strong>Reminder:</strong> Please return the book "<em>${bookTitle}</em>"
          by <strong>${returnDate}</strong>. Thank you!
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Arabic Youth Library" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Reminder: Return "${bookTitle}" by ${returnDate} - تذكير بإعادة الكتاب`,
    html,
  });
};

module.exports = { sendPickupReminder, sendReturnReminder };

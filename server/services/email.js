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
const sendPickupReminder = async ({ to, name, bookTitle, date, time, locationName }) => {
  const locationLine = locationName ? `<p style="margin: 0 0 8px; color: #111827;"><strong>الفرع:</strong> ${locationName}</p>` : '';
  const locationLineEn = locationName ? ` at <strong>${locationName}</strong>` : '';
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
          ${locationLine}
          <p style="margin: 0 0 8px; color: #111827;"><strong>التاريخ:</strong> ${date}</p>
          <p style="margin: 0; color: #111827;"><strong>الوقت:</strong> ${time}</p>
        </div>
        <p style="color: #374151;">
          يرجى الحضور في الموعد المحدد لاستلام الكتاب. شكراً لك!
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #6b7280; font-size: 13px; direction: ltr; text-align: left;">
          <strong>Reminder:</strong> Please come to pick up the book "<em>${bookTitle}</em>"
          on <strong>${date}</strong> at <strong>${time}</strong>${locationLineEn}. Thank you!
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
const sendReturnReminder = async ({ to, name, bookTitle, returnDate, locationName }) => {
  const locationLine = locationName ? `<p style="margin: 0 0 8px; color: #111827;"><strong>الفرع:</strong> ${locationName}</p>` : '';
  const locationLineEn = locationName ? ` to <strong>${locationName}</strong>` : '';
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
          ${locationLine}
          <p style="margin: 0; color: #111827;"><strong>تاريخ الإرجاع:</strong> ${returnDate}</p>
        </div>
        <p style="color: #374151;">
          يرجى إعادة الكتاب في الموعد المحدد. شكراً لك!
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #6b7280; font-size: 13px; direction: ltr; text-align: left;">
          <strong>Reminder:</strong> Please return the book "<em>${bookTitle}</em>"${locationLineEn}
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

/**
 * Send a reservation confirmation email (when user creates a reservation).
 */
const sendReservationConfirmation = async ({ to, name, bookTitle, date, time, locationName }) => {
  const locationLine = locationName ? `<p style="margin: 0 0 8px; color: #111827;"><strong>الفرع:</strong> ${locationName}</p>` : '';
  const locationLineEn = locationName ? ` at <strong>${locationName}</strong>` : '';
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
          تم تأكيد حجزك بنجاح! إليك تفاصيل الحجز:
        </p>
        <div style="background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px; color: #111827;"><strong>الكتاب:</strong> ${bookTitle}</p>
          ${locationLine}
          <p style="margin: 0 0 8px; color: #111827;"><strong>تاريخ الاستلام:</strong> ${date}</p>
          <p style="margin: 0; color: #111827;"><strong>الوقت:</strong> ${time}</p>
        </div>
        <p style="color: #374151;">
          يرجى الحضور في الموعد المحدد لاستلام الكتاب. شكراً لك!
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #6b7280; font-size: 13px; direction: ltr; text-align: left;">
          <strong>Confirmation:</strong> Your reservation for "<em>${bookTitle}</em>"
          has been confirmed for <strong>${date}</strong> at <strong>${time}</strong>${locationLineEn}.
          Please come at the scheduled time to pick up your book. Thank you!
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Arabic Youth Library" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Reservation Confirmed: "${bookTitle}" - تأكيد حجز الكتاب`,
    html,
  });
};

/**
 * Send a collection confirmation email (when admin marks as collected, includes return date).
 */
const sendCollectionConfirmation = async ({ to, name, bookTitle, returnDate, locationName }) => {
  const locationLine = locationName ? `<p style="margin: 0 0 8px; color: #111827;"><strong>الفرع:</strong> ${locationName}</p>` : '';
  const locationLineEn = locationName ? ` to <strong>${locationName}</strong>` : '';
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
          تم تأكيد استلامك للكتاب. يرجى إعادته في الموعد المحدد:
        </p>
        <div style="background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px; color: #111827;"><strong>الكتاب:</strong> ${bookTitle}</p>
          ${locationLine}
          <p style="margin: 0; color: #111827;"><strong>تاريخ الإرجاع:</strong> ${returnDate}</p>
        </div>
        <p style="color: #374151;">
          يرجى إعادة الكتاب قبل أو في الموعد المحدد. شكراً لك!
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #6b7280; font-size: 13px; direction: ltr; text-align: left;">
          <strong>Collection Confirmed:</strong> You have picked up "<em>${bookTitle}</em>".
          Please return the book${locationLineEn} by <strong>${returnDate}</strong>. Thank you!
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Arabic Youth Library" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Book Collected: "${bookTitle}" — Return by ${returnDate} - تم استلام الكتاب`,
    html,
  });
};

/**
 * Send a cancellation notification email (when admin cancels a reservation).
 */
const sendCancellationNotice = async ({ to, name, bookTitle, locationName }) => {
  const locationLine = locationName ? `<p style="margin: 0 0 8px; color: #111827;"><strong>الفرع:</strong> ${locationName}</p>` : '';
  const locationLineEn = locationName ? ` at <strong>${locationName}</strong>` : '';
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
          نود إعلامك بأنه تم إلغاء حجزك للكتاب التالي:
        </p>
        <div style="background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px; color: #111827;"><strong>الكتاب:</strong> ${bookTitle}</p>
          ${locationLine}
        </div>
        <p style="color: #374151;">
          إذا كان لديك أي استفسار، لا تتردد في التواصل معنا. شكراً لك.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #6b7280; font-size: 13px; direction: ltr; text-align: left;">
          <strong>Cancellation Notice:</strong> Your reservation for "<em>${bookTitle}</em>"${locationLineEn}
          has been cancelled. If you have any questions, please contact us. Thank you.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Arabic Youth Library" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Reservation Cancelled: "${bookTitle}" - تم إلغاء الحجز`,
    html,
  });
};

/**
 * Send a new reservation notification email to admin(s) when a public user reserves a book.
 */
const sendNewReservationNotification = async ({ to, bookTitle, customerName, customerEmail, customerPhone, date, time, locationName }) => {
  const phoneLine = customerPhone
    ? `<p style="margin: 0 0 8px; color: #111827;"><strong>الهاتف:</strong> ${customerPhone}</p>`
    : '';
  const phoneLineEn = customerPhone
    ? `<p style="margin: 0 0 8px; color: #111827;"><strong>Phone:</strong> ${customerPhone}</p>`
    : '';
  const locationLine = locationName
    ? `<p style="margin: 0 0 8px; color: #111827;"><strong>الفرع:</strong> ${locationName}</p>`
    : '';
  const locationLineEn = locationName
    ? `<p style="margin: 0 0 8px; color: #111827;"><strong>Location:</strong> ${locationName}</p>`
    : '';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; direction: rtl; text-align: right;">
      <div style="background: #059669; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">مكتبة الشباب العربي</h2>
        <p style="margin: 5px 0 0; opacity: 0.9;">Arabic Youth Library</p>
      </div>
      <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="color: #374151; font-size: 16px; font-weight: bold;">
          حجز جديد!
        </p>
        <p style="color: #374151;">
          تم استلام حجز جديد. إليك التفاصيل:
        </p>
        <div style="background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 12px; color: #059669; font-weight: bold; font-size: 15px;">معلومات الكتاب</p>
          <p style="margin: 0 0 8px; color: #111827;"><strong>الكتاب:</strong> ${bookTitle}</p>
          ${locationLine}
          <p style="margin: 0 0 8px; color: #111827;"><strong>تاريخ الاستلام:</strong> ${date}</p>
          <p style="margin: 0; color: #111827;"><strong>الوقت:</strong> ${time}</p>
        </div>
        <div style="background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 12px; color: #059669; font-weight: bold; font-size: 15px;">معلومات العميل</p>
          <p style="margin: 0 0 8px; color: #111827;"><strong>الاسم:</strong> ${customerName}</p>
          <p style="margin: 0 0 8px; color: #111827;"><strong>البريد الإلكتروني:</strong> ${customerEmail}</p>
          ${phoneLine}
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <div style="direction: ltr; text-align: left;">
          <p style="color: #374151; font-size: 16px; font-weight: bold;">
            New Reservation!
          </p>
          <p style="color: #374151;">
            A new reservation has been received. Here are the details:
          </p>
          <div style="background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 12px; color: #059669; font-weight: bold; font-size: 15px;">Book Info</p>
            <p style="margin: 0 0 8px; color: #111827;"><strong>Book:</strong> ${bookTitle}</p>
            ${locationLineEn}
            <p style="margin: 0 0 8px; color: #111827;"><strong>Pickup Date:</strong> ${date}</p>
            <p style="margin: 0; color: #111827;"><strong>Time:</strong> ${time}</p>
          </div>
          <div style="background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 12px; color: #059669; font-weight: bold; font-size: 15px;">Customer Info</p>
            <p style="margin: 0 0 8px; color: #111827;"><strong>Name:</strong> ${customerName}</p>
            <p style="margin: 0 0 8px; color: #111827;"><strong>Email:</strong> ${customerEmail}</p>
            ${phoneLineEn}
          </div>
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Arabic Youth Library" <${process.env.EMAIL_USER}>`,
    to,
    subject: `New Reservation: "${bookTitle}" by ${customerName} - حجز جديد`,
    html,
  });
};

/**
 * Send a pickup notification to admin(s) — a customer is coming to collect a book tomorrow.
 */
const sendAdminPickupNotification = async ({ to, customerName, customerEmail, customerPhone, bookTitle, date, time, locationName }) => {
  const phoneLine = customerPhone
    ? `<p style="margin: 0 0 8px; color: #111827;"><strong>الهاتف:</strong> ${customerPhone}</p>`
    : '';
  const phoneLineEn = customerPhone
    ? `<p style="margin: 0 0 8px; color: #111827;"><strong>Phone:</strong> ${customerPhone}</p>`
    : '';
  const locationLine = locationName
    ? `<p style="margin: 0 0 8px; color: #111827;"><strong>الفرع:</strong> ${locationName}</p>`
    : '';
  const locationLineEn = locationName
    ? `<p style="margin: 0 0 8px; color: #111827;"><strong>Location:</strong> ${locationName}</p>`
    : '';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; direction: rtl; text-align: right;">
      <div style="background: #059669; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">مكتبة الشباب العربي</h2>
        <p style="margin: 5px 0 0; opacity: 0.9;">Arabic Youth Library</p>
      </div>
      <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="color: #374151; font-size: 16px; font-weight: bold;">
          تذكير: عميل سيحضر لاستلام كتاب غداً
        </p>
        <div style="background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 12px; color: #059669; font-weight: bold; font-size: 15px;">معلومات الكتاب</p>
          <p style="margin: 0 0 8px; color: #111827;"><strong>الكتاب:</strong> ${bookTitle}</p>
          ${locationLine}
          <p style="margin: 0 0 8px; color: #111827;"><strong>تاريخ الاستلام:</strong> ${date}</p>
          <p style="margin: 0; color: #111827;"><strong>الوقت:</strong> ${time}</p>
        </div>
        <div style="background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 12px; color: #059669; font-weight: bold; font-size: 15px;">معلومات العميل</p>
          <p style="margin: 0 0 8px; color: #111827;"><strong>الاسم:</strong> ${customerName}</p>
          <p style="margin: 0 0 8px; color: #111827;"><strong>البريد الإلكتروني:</strong> ${customerEmail}</p>
          ${phoneLine}
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <div style="direction: ltr; text-align: left;">
          <p style="color: #374151; font-size: 16px; font-weight: bold;">
            Reminder: Customer Coming to Collect a Book Tomorrow
          </p>
          <div style="background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 12px; color: #059669; font-weight: bold; font-size: 15px;">Book Info</p>
            <p style="margin: 0 0 8px; color: #111827;"><strong>Book:</strong> ${bookTitle}</p>
            ${locationLineEn}
            <p style="margin: 0 0 8px; color: #111827;"><strong>Pickup Date:</strong> ${date}</p>
            <p style="margin: 0; color: #111827;"><strong>Time:</strong> ${time}</p>
          </div>
          <div style="background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 12px; color: #059669; font-weight: bold; font-size: 15px;">Customer Info</p>
            <p style="margin: 0 0 8px; color: #111827;"><strong>Name:</strong> ${customerName}</p>
            <p style="margin: 0 0 8px; color: #111827;"><strong>Email:</strong> ${customerEmail}</p>
            ${phoneLineEn}
          </div>
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Arabic Youth Library" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Pickup Tomorrow: "${bookTitle}" by ${customerName} - استلام كتاب غداً`,
    html,
  });
};

/**
 * Send a return notification to admin(s) — a customer should return a book tomorrow.
 */
const sendAdminReturnNotification = async ({ to, customerName, customerEmail, customerPhone, bookTitle, returnDate, locationName }) => {
  const phoneLine = customerPhone
    ? `<p style="margin: 0 0 8px; color: #111827;"><strong>الهاتف:</strong> ${customerPhone}</p>`
    : '';
  const phoneLineEn = customerPhone
    ? `<p style="margin: 0 0 8px; color: #111827;"><strong>Phone:</strong> ${customerPhone}</p>`
    : '';
  const locationLine = locationName
    ? `<p style="margin: 0 0 8px; color: #111827;"><strong>الفرع:</strong> ${locationName}</p>`
    : '';
  const locationLineEn = locationName
    ? `<p style="margin: 0 0 8px; color: #111827;"><strong>Location:</strong> ${locationName}</p>`
    : '';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; direction: rtl; text-align: right;">
      <div style="background: #059669; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">مكتبة الشباب العربي</h2>
        <p style="margin: 5px 0 0; opacity: 0.9;">Arabic Youth Library</p>
      </div>
      <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="color: #374151; font-size: 16px; font-weight: bold;">
          تذكير: عميل يجب أن يعيد كتاباً غداً
        </p>
        <div style="background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 12px; color: #059669; font-weight: bold; font-size: 15px;">معلومات الكتاب</p>
          <p style="margin: 0 0 8px; color: #111827;"><strong>الكتاب:</strong> ${bookTitle}</p>
          ${locationLine}
          <p style="margin: 0; color: #111827;"><strong>تاريخ الإرجاع:</strong> ${returnDate}</p>
        </div>
        <div style="background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 12px; color: #059669; font-weight: bold; font-size: 15px;">معلومات العميل</p>
          <p style="margin: 0 0 8px; color: #111827;"><strong>الاسم:</strong> ${customerName}</p>
          <p style="margin: 0 0 8px; color: #111827;"><strong>البريد الإلكتروني:</strong> ${customerEmail}</p>
          ${phoneLine}
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <div style="direction: ltr; text-align: left;">
          <p style="color: #374151; font-size: 16px; font-weight: bold;">
            Reminder: Customer Should Return a Book Tomorrow
          </p>
          <div style="background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 12px; color: #059669; font-weight: bold; font-size: 15px;">Book Info</p>
            <p style="margin: 0 0 8px; color: #111827;"><strong>Book:</strong> ${bookTitle}</p>
            ${locationLineEn}
            <p style="margin: 0; color: #111827;"><strong>Return Date:</strong> ${returnDate}</p>
          </div>
          <div style="background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 12px; color: #059669; font-weight: bold; font-size: 15px;">Customer Info</p>
            <p style="margin: 0 0 8px; color: #111827;"><strong>Name:</strong> ${customerName}</p>
            <p style="margin: 0 0 8px; color: #111827;"><strong>Email:</strong> ${customerEmail}</p>
            ${phoneLineEn}
          </div>
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Arabic Youth Library" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Return Due Tomorrow: "${bookTitle}" by ${customerName} - إرجاع كتاب غداً`,
    html,
  });
};

/**
 * Send a return date extension notification to customer when admin extends the return date.
 */
const sendReturnExtensionNotice = async ({ to, name, bookTitle, newReturnDate, locationName }) => {
  const locationLine = locationName ? `<p style="margin: 0 0 8px; color: #111827;"><strong>الفرع:</strong> ${locationName}</p>` : '';
  const locationLineEn = locationName ? ` at <strong>${locationName}</strong>` : '';
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
          تم تمديد موعد إرجاع الكتاب الخاص بك. إليك الموعد الجديد:
        </p>
        <div style="background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px; color: #111827;"><strong>الكتاب:</strong> ${bookTitle}</p>
          ${locationLine}
          <p style="margin: 0; color: #111827;"><strong>تاريخ الإرجاع الجديد:</strong> ${newReturnDate}</p>
        </div>
        <p style="color: #374151;">
          يرجى إعادة الكتاب قبل أو في الموعد الجديد. شكراً لك!
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #6b7280; font-size: 13px; direction: ltr; text-align: left;">
          <strong>Return Date Extended:</strong> Your return date for "<em>${bookTitle}</em>"${locationLineEn}
          has been extended to <strong>${newReturnDate}</strong>. Please return the book by the new date. Thank you!
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Arabic Youth Library" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Return Date Extended: "${bookTitle}" — New date: ${newReturnDate} - تم تمديد موعد الإرجاع`,
    html,
  });
};

/**
 * Send a return confirmation email to customer when admin marks reservation as completed (returned).
 */
const sendReturnConfirmation = async ({ to, name, bookTitle, locationName }) => {
  const locationLine = locationName ? `<p style="margin: 0 0 8px; color: #111827;"><strong>الفرع:</strong> ${locationName}</p>` : '';
  const locationLineEn = locationName ? ` at <strong>${locationName}</strong>` : '';
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
          تم تأكيد إرجاع الكتاب بنجاح. شكراً لالتزامك!
        </p>
        <div style="background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px; color: #111827;"><strong>الكتاب:</strong> ${bookTitle}</p>
          ${locationLine}
        </div>
        <p style="color: #374151;">
          نتطلع لزيارتك القادمة. شكراً لك!
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #6b7280; font-size: 13px; direction: ltr; text-align: left;">
          <strong>Book Returned:</strong> You have successfully returned "<em>${bookTitle}</em>"${locationLineEn}.
          Thank you for returning the book on time. We look forward to your next visit!
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Arabic Youth Library" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Book Returned: "${bookTitle}" - تم إرجاع الكتاب`,
    html,
  });
};

module.exports = { sendPickupReminder, sendReturnReminder, sendReservationConfirmation, sendCollectionConfirmation, sendCancellationNotice, sendNewReservationNotification, sendAdminPickupNotification, sendAdminReturnNotification, sendReturnExtensionNotice, sendReturnConfirmation };

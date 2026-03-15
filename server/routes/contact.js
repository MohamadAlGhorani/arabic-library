const express = require('express');
const nodemailer = require('nodemailer');
const Admin = require('../models/Admin');
const Location = require('../models/Location');

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// POST /api/contact - public
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message, locationId } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Get location name if provided
    let locationName = '';
    if (locationId) {
      const location = await Location.findById(locationId).select('name');
      locationName = location?.name || '';
    }

    // Find admin emails to send to
    const adminFilter = { isActive: true, email: { $ne: '' } };
    if (locationId) {
      adminFilter.$or = [
        { role: 'super_admin' },
        { role: 'location_admin', location: locationId },
      ];
    } else {
      adminFilter.role = 'super_admin';
    }

    const admins = await Admin.find(adminFilter).select('email');
    const adminEmails = admins.map((a) => a.email).filter(Boolean);

    if (adminEmails.length === 0) {
      return res.status(500).json({ message: 'No admin contacts available' });
    }

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
            رسالة جديدة من الموقع
          </p>
          <div style="background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 12px; color: #059669; font-weight: bold; font-size: 15px;">معلومات المرسل</p>
            <p style="margin: 0 0 8px; color: #111827;"><strong>الاسم:</strong> ${name}</p>
            <p style="margin: 0 0 8px; color: #111827;"><strong>البريد الإلكتروني:</strong> ${email}</p>
            ${locationLine}
          </div>
          <div style="background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 12px; color: #059669; font-weight: bold; font-size: 15px;">الرسالة</p>
            <p style="margin: 0 0 8px; color: #111827;"><strong>الموضوع:</strong> ${subject}</p>
            <p style="margin: 0; color: #111827; white-space: pre-wrap;">${message}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <div style="direction: ltr; text-align: left;">
            <p style="color: #374151; font-size: 16px; font-weight: bold;">
              New Contact Message
            </p>
            <div style="background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0 0 12px; color: #059669; font-weight: bold; font-size: 15px;">Sender Info</p>
              <p style="margin: 0 0 8px; color: #111827;"><strong>Name:</strong> ${name}</p>
              <p style="margin: 0 0 8px; color: #111827;"><strong>Email:</strong> ${email}</p>
              ${locationLineEn}
            </div>
            <div style="background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0 0 12px; color: #059669; font-weight: bold; font-size: 15px;">Message</p>
              <p style="margin: 0 0 8px; color: #111827;"><strong>Subject:</strong> ${subject}</p>
              <p style="margin: 0; color: #111827; white-space: pre-wrap;">${message}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Arabic Youth Library" <${process.env.EMAIL_USER}>`,
      replyTo: email,
      to: adminEmails.join(','),
      subject: `Contact: ${subject} — from ${name}`,
      html,
    });

    res.json({ message: 'Your message has been sent successfully.' });
  } catch (error) {
    console.error('Contact form error:', error.message);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

module.exports = router;

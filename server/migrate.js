/**
 * Migration script for existing databases.
 * Creates a default location and assigns all existing data to it.
 * Safe to run multiple times — skips if default location already exists.
 *
 * Usage: node migrate.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const Book = require('./models/Book');
const Reservation = require('./models/Reservation');
const Settings = require('./models/Settings');
const Location = require('./models/Location');

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if migration already ran
    const existingLocation = await Location.findOne();
    if (existingLocation) {
      console.log('Migration already completed — locations exist. Skipping.');
      process.exit(0);
    }

    // 1. Create default location
    const location = await Location.create({
      name: 'Main Library',
      description: 'The main branch of Arabic Youth Library',
    });
    console.log('Created default location:', location.name);

    // 2. Migrate singleton settings to per-location
    const existingSettings = await Settings.findOne();
    if (existingSettings) {
      existingSettings.location = location._id;
      await existingSettings.save();
      console.log('Migrated existing settings to default location');
    } else {
      await Settings.create({ location: location._id });
      console.log('Created default settings for location');
    }

    // 3. Assign all books to default location
    const bookResult = await Book.updateMany(
      { location: { $exists: false } },
      { $set: { location: location._id } }
    );
    console.log(`Assigned ${bookResult.modifiedCount} books to default location`);

    // 4. Assign all reservations to default location
    const resResult = await Reservation.updateMany(
      { location: { $exists: false } },
      { $set: { location: location._id } }
    );
    console.log(`Assigned ${resResult.modifiedCount} reservations to default location`);

    // 5. Promote all existing admins to super_admin
    const adminResult = await Admin.updateMany(
      { role: { $exists: false } },
      { $set: { role: 'super_admin', location: null } }
    );
    console.log(`Promoted ${adminResult.modifiedCount} admins to super_admin`);

    console.log('\nMigration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrate();

require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const Category = require('./models/Category');
const Book = require('./models/Book');
const Reservation = require('./models/Reservation');
const Settings = require('./models/Settings');
const Location = require('./models/Location');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Admin.deleteMany({});
    await Category.deleteMany({});
    await Book.deleteMany({});
    await Reservation.deleteMany({});
    await Settings.deleteMany({});
    await Location.deleteMany({});

    // Create default location
    const location = await Location.create({
      name: 'Main Library',
      address: '',
      phone: '',
      description: 'The main branch of Arabic Youth Library',
    });
    console.log('Default location created:', location.name);

    // Create default settings for this location
    await Settings.create({ location: location._id });
    console.log('Default settings created for location');

    // Create super admin
    await Admin.create({
      username: 'admin',
      password: 'admin123',
      role: 'super_admin',
      location: null,
    });
    console.log('Super admin created: username=admin, password=admin123');

    // Create categories
    const categoryNames = ['Stories', 'Adventure', 'Educational', 'Islamic', 'Science', 'History'];
    const categories = await Category.insertMany(
      categoryNames.map((name) => ({ name }))
    );
    console.log(`Created ${categories.length} categories`);

    // Create sample books
    const sampleBooks = [
      { title: 'حكايات من الشرق', description: 'مجموعة من القصص الشرقية الممتعة للشباب', category: categories[0]._id, status: 'available', location: location._id },
      { title: 'مغامرات سندباد', description: 'رحلات سندباد البحري المثيرة عبر البحار', category: categories[1]._id, status: 'available', location: location._id },
      { title: 'تعلم العربية', description: 'كتاب تعليمي لتحسين مهارات اللغة العربية', category: categories[2]._id, status: 'available', location: location._id },
      { title: 'قصص الأنبياء', description: 'قصص الأنبياء للناشئة بأسلوب مبسط وممتع', category: categories[3]._id, status: 'available', location: location._id },
      { title: 'عجائب الكون', description: 'اكتشف أسرار الفضاء والكواكب والنجوم', category: categories[4]._id, status: 'available', location: location._id },
      { title: 'تاريخ الحضارة العربية', description: 'رحلة عبر تاريخ الحضارة العربية والإسلامية', category: categories[5]._id, status: 'available', location: location._id },
      { title: 'ألف ليلة وليلة', description: 'أشهر القصص العربية الكلاسيكية', category: categories[0]._id, status: 'available', location: location._id },
      { title: 'كنوز المعرفة', description: 'موسوعة علمية مبسطة للشباب', category: categories[4]._id, status: 'available', location: location._id },
    ];

    await Book.insertMany(sampleBooks);
    console.log(`Created ${sampleBooks.length} sample books`);

    console.log('\nSeed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDB();

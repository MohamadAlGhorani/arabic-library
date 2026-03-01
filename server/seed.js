require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const Category = require('./models/Category');
const Book = require('./models/Book');
const Reservation = require('./models/Reservation');
const Settings = require('./models/Settings');
const Location = require('./models/Location');
const PageContent = require('./models/PageContent');

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
    await PageContent.deleteMany({});

    // Create default location
    const location = await Location.create({
      name: 'Main Library',
      address: '',
      phone: '',
      description: 'The main branch of Arabic Youth Library',
    });
    console.log('Default location created:', location.name);

    // Create second location
    const location2 = await Location.create({
      name: 'Community Branch',
      address: '',
      phone: '',
      description: 'Community branch of Arabic Youth Library',
    });
    console.log('Second location created:', location2.name);

    // Create default settings for both locations
    await Settings.create({ location: location._id });
    await Settings.create({ location: location2._id });
    console.log('Default settings created for both locations');

    // Create super admin
    await Admin.create({
      username: 'admin',
      password: 'admin123',
      role: 'super_admin',
      location: null,
    });
    console.log('Super admin created: username=admin, password=admin123');

    // Create location admin for second location
    await Admin.create({
      username: 'locadmin',
      password: 'admin123',
      role: 'location_admin',
      location: location2._id,
      fullName: 'Location Admin',
      email: 'locadmin@library.com',
    });
    console.log('Location admin created: username=locadmin, password=admin123 (Community Branch)');

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

    // Books for second location
    const sampleBooks2 = [
      { title: 'رحلة ابن بطوطة', description: 'مغامرات ابن بطوطة حول العالم للناشئة', category: categories[1]._id, status: 'available', location: location2._id },
      { title: 'الحروف المرحة', description: 'كتاب تعليمي ممتع لتعلم الحروف العربية', category: categories[2]._id, status: 'available', location: location2._id },
      { title: 'قصص من القرآن', description: 'قصص قرآنية بأسلوب مبسط للأطفال', category: categories[3]._id, status: 'available', location: location2._id },
      { title: 'أسرار البحار', description: 'اكتشف عجائب عالم البحار والمحيطات', category: categories[4]._id, status: 'available', location: location2._id },
      { title: 'حكايات جدتي', description: 'قصص تراثية من التراث العربي القديم', category: categories[0]._id, status: 'available', location: location2._id },
      { title: 'صلاح الدين الأيوبي', description: 'قصة البطل صلاح الدين وتحرير القدس', category: categories[5]._id, status: 'available', location: location2._id },
    ];

    await Book.insertMany([...sampleBooks, ...sampleBooks2]);
    console.log(`Created ${sampleBooks.length + sampleBooks2.length} sample books (${sampleBooks.length} Main Library + ${sampleBooks2.length} Community Branch)`);

    // Seed About page
    await PageContent.create({
      slug: 'about',
      title_en: 'About the Arabic Youth Library',
      title_ar: 'عن مكتبة الشباب العربي',
      title_nl: 'Over de Arabische Jeugdbibliotheek',
      content_en: `<h2>Our Story</h2>
<p>The Arabic Youth Library was born from a simple yet powerful idea: every young person deserves access to the rich world of Arabic literature, no matter where they live. We believe that books have the power to connect generations, preserve culture, and ignite the imagination of young minds.</p>

<h2>Our Mission</h2>
<p>We are dedicated to making Arabic books accessible and enjoyable for young readers across our communities. Through our growing network of library branches, we bring the beauty of Arabic storytelling, poetry, and knowledge directly to your neighborhood.</p>

<h2>What Makes Us Special</h2>
<p>Unlike traditional libraries, we focus exclusively on Arabic literature for youth. Our carefully curated collection spans across many genres:</p>
<ul>
<li><strong>Classic Tales</strong> — Timeless stories from the rich Arabic literary tradition</li>
<li><strong>Educational Books</strong> — Resources to help young learners master the Arabic language</li>
<li><strong>Islamic Literature</strong> — Beautiful retellings of prophets' stories and Islamic heritage</li>
<li><strong>Science & Discovery</strong> — Fascinating explorations of the natural world in Arabic</li>
<li><strong>Adventure & Fiction</strong> — Exciting tales that spark the imagination</li>
<li><strong>History & Culture</strong> — Journeys through the magnificent Arab civilization</li>
</ul>

<h2>Our Community</h2>
<p>We are more than just a library — we are a community of families, educators, and book lovers who share a passion for Arabic culture and reading. With multiple branches across different locations, we make it easy for you to find us close to home.</p>

<p>Our team of passionate volunteers and staff work tirelessly to ensure that every visit to the Arabic Youth Library is a delightful experience. Whether you are a parent looking for bedtime stories, a teacher seeking educational resources, or a young reader eager to explore new worlds through Arabic books — you are welcome here.</p>

<blockquote>Reading is the gateway to knowledge, and we are proud to hold that gate open for every young reader in our community.</blockquote>`,

      content_ar: `<h2>قصتنا</h2>
<p>وُلدت مكتبة الشباب العربي من فكرة بسيطة وقوية: كل شاب يستحق الوصول إلى عالم الأدب العربي الغني، بغض النظر عن مكان إقامته. نؤمن بأن الكتب لديها القدرة على ربط الأجيال، والحفاظ على الثقافة، وإشعال خيال العقول الشابة.</p>

<h2>رسالتنا</h2>
<p>نحن ملتزمون بجعل الكتب العربية متاحة وممتعة للقراء الشباب في مجتمعاتنا. من خلال شبكتنا المتنامية من فروع المكتبة، نقدم جمال السرد العربي والشعر والمعرفة مباشرة إلى حيّك.</p>

<h2>ما يميزنا</h2>
<p>على عكس المكتبات التقليدية، نركز حصرياً على الأدب العربي للشباب. مجموعتنا المختارة بعناية تشمل العديد من الأنواع:</p>
<ul>
<li><strong>القصص الكلاسيكية</strong> — حكايات خالدة من التراث الأدبي العربي الغني</li>
<li><strong>الكتب التعليمية</strong> — موارد لمساعدة المتعلمين الشباب على إتقان اللغة العربية</li>
<li><strong>الأدب الإسلامي</strong> — إعادة سرد جميلة لقصص الأنبياء والتراث الإسلامي</li>
<li><strong>العلوم والاكتشاف</strong> — استكشافات رائعة للعالم الطبيعي باللغة العربية</li>
<li><strong>المغامرات والخيال</strong> — حكايات مثيرة تشعل الخيال</li>
<li><strong>التاريخ والثقافة</strong> — رحلات عبر الحضارة العربية العظيمة</li>
</ul>

<h2>مجتمعنا</h2>
<p>نحن أكثر من مجرد مكتبة — نحن مجتمع من العائلات والمعلمين ومحبي الكتب الذين يتشاركون شغفهم بالثقافة العربية والقراءة. مع فروع متعددة في مواقع مختلفة، نسهّل عليك العثور علينا بالقرب من منزلك.</p>

<p>يعمل فريقنا من المتطوعين والموظفين المتحمسين بلا كلل لضمان أن كل زيارة لمكتبة الشباب العربي تكون تجربة ممتعة. سواء كنت والداً تبحث عن قصص ما قبل النوم، أو معلماً يبحث عن موارد تعليمية، أو قارئاً شاباً متحمساً لاستكشاف عوالم جديدة من خلال الكتب العربية — أهلاً بك هنا.</p>

<blockquote>القراءة هي بوابة المعرفة، ونحن فخورون بأن نبقي تلك البوابة مفتوحة لكل قارئ شاب في مجتمعنا.</blockquote>`,

      content_nl: `<h2>Ons Verhaal</h2>
<p>De Arabische Jeugdbibliotheek is ontstaan uit een eenvoudig maar krachtig idee: elke jongere verdient toegang tot de rijke wereld van de Arabische literatuur, ongeacht waar ze wonen. Wij geloven dat boeken de kracht hebben om generaties te verbinden, cultuur te bewaren en de verbeelding van jonge geesten te prikkelen.</p>

<h2>Onze Missie</h2>
<p>Wij zetten ons in om Arabische boeken toegankelijk en plezierig te maken voor jonge lezers in onze gemeenschappen. Via ons groeiende netwerk van bibliotheekfilialen brengen we de schoonheid van Arabische verhalen, poëzie en kennis direct naar uw buurt.</p>

<h2>Wat Ons Bijzonder Maakt</h2>
<p>Anders dan traditionele bibliotheken richten wij ons exclusief op Arabische literatuur voor jongeren. Onze zorgvuldig samengestelde collectie omvat vele genres:</p>
<ul>
<li><strong>Klassieke Verhalen</strong> — Tijdloze verhalen uit de rijke Arabische literaire traditie</li>
<li><strong>Educatieve Boeken</strong> — Hulpmiddelen om jonge leerlingen te helpen de Arabische taal te beheersen</li>
<li><strong>Islamitische Literatuur</strong> — Prachtige hervertellingen van profetenverhalen en islamitisch erfgoed</li>
<li><strong>Wetenschap & Ontdekking</strong> — Fascinerende verkenningen van de natuurlijke wereld in het Arabisch</li>
<li><strong>Avontuur & Fictie</strong> — Spannende verhalen die de verbeelding prikkelen</li>
<li><strong>Geschiedenis & Cultuur</strong> — Reizen door de prachtige Arabische beschaving</li>
</ul>

<h2>Onze Gemeenschap</h2>
<p>Wij zijn meer dan alleen een bibliotheek — wij zijn een gemeenschap van gezinnen, docenten en boekliefhebbers die een passie delen voor Arabische cultuur en lezen. Met meerdere filialen op verschillende locaties maken we het gemakkelijk om ons dicht bij huis te vinden.</p>

<p>Ons team van gepassioneerde vrijwilligers en medewerkers werkt onvermoeibaar om ervoor te zorgen dat elk bezoek aan de Arabische Jeugdbibliotheek een heerlijke ervaring is. Of u nu een ouder bent die op zoek is naar verhaaltjes voor het slapengaan, een leraar die educatieve bronnen zoekt, of een jonge lezer die graag nieuwe werelden verkent via Arabische boeken — u bent hier welkom.</p>

<blockquote>Lezen is de toegangspoort tot kennis, en wij zijn er trots op die poort open te houden voor elke jonge lezer in onze gemeenschap.</blockquote>`,
    });
    console.log('About page content seeded');

    // Seed How It Works page
    await PageContent.create({
      slug: 'how-it-works',
      title_en: 'How It Works',
      title_ar: 'كيف يعمل',
      title_nl: 'Hoe Het Werkt',
      content_en: `<h2>Your Reading Journey in 6 Simple Steps</h2>
<p>Getting started with the Arabic Youth Library is easy and affordable. Here's how you can begin your journey into the wonderful world of Arabic books:</p>

<h3>1. Browse Our Catalog</h3>
<p>Explore our extensive online catalog right from the comfort of your home. Filter books by category — from classic tales and adventure stories to educational resources and Islamic literature. Find the perfect book that matches your interests or your child's reading level.</p>

<h3>2. Reserve Your Book</h3>
<p>Found a book you love? Simply click "Reserve" and choose a convenient pickup date and time slot. Fill in your details, and you'll receive a confirmation email with all the information you need. It's that simple!</p>

<h3>3. Visit Your Location & Subscribe</h3>
<p>Come to your chosen library branch at the scheduled time. On your <strong>first visit</strong>, you'll sign up for our monthly subscription — a small, affordable fee that gives you unlimited access to our entire collection. Our friendly staff will guide you through the quick registration process.</p>

<h3>4. Collect Your Book</h3>
<p>Pick up your reserved book and it's all yours to enjoy! We'll confirm the collection and set a return date that works for you. No rush — we want you to enjoy every page at your own pace.</p>

<h3>5. Read & Enjoy</h3>
<p>Take your book home and dive into the wonderful world of Arabic literature. Whether it's a bedtime story, a weekend adventure, or an educational journey — savor every moment with your book.</p>

<h3>6. Return & Borrow More</h3>
<p>When you've finished reading, simply return the book to any of our locations. And here's the best part — with your monthly subscription, you can borrow <strong>unlimited books</strong>! Return one and pick up another right away. There's no limit to how many books you can enjoy.</p>

<h2>Why Subscribe?</h2>
<ul>
<li><strong>Unlimited Borrowing</strong> — Read as many books as you want, one at a time</li>
<li><strong>Affordable</strong> — A small monthly fee gives you access to our entire collection</li>
<li><strong>Multiple Locations</strong> — Borrow from any branch, return to any branch</li>
<li><strong>Growing Collection</strong> — We add new books regularly to keep things fresh</li>
<li><strong>Email Reminders</strong> — We'll remind you about pickup and return dates</li>
<li><strong>Family Friendly</strong> — One subscription covers the whole family</li>
</ul>

<blockquote>Start your reading adventure today — browse our catalog and reserve your first book!</blockquote>`,

      content_ar: `<h2>رحلتك في القراءة في 6 خطوات بسيطة</h2>
<p>البدء مع مكتبة الشباب العربي سهل وبأسعار معقولة. إليك كيف يمكنك بدء رحلتك في عالم الكتب العربية الرائع:</p>

<h3>1. تصفح كتالوجنا</h3>
<p>استكشف كتالوجنا الواسع عبر الإنترنت من راحة منزلك. صنّف الكتب حسب الفئة — من القصص الكلاسيكية وقصص المغامرات إلى الموارد التعليمية والأدب الإسلامي. اعثر على الكتاب المثالي الذي يناسب اهتماماتك أو مستوى قراءة طفلك.</p>

<h3>2. احجز كتابك</h3>
<p>وجدت كتاباً أعجبك؟ ما عليك سوى النقر على "احجز" واختيار تاريخ ووقت استلام مناسبين. أدخل بياناتك وستتلقى بريداً إلكترونياً للتأكيد مع جميع المعلومات التي تحتاجها. بهذه البساطة!</p>

<h3>3. قم بزيارة فرعنا واشترك</h3>
<p>تعال إلى فرع المكتبة الذي اخترته في الموعد المحدد. في <strong>زيارتك الأولى</strong>، ستسجل في اشتراكنا الشهري — رسوم بسيطة ومعقولة تمنحك وصولاً غير محدود إلى مجموعتنا الكاملة. سيرشدك فريقنا الودود خلال عملية التسجيل السريعة.</p>

<h3>4. استلم كتابك</h3>
<p>استلم كتابك المحجوز وهو لك للاستمتاع! سنؤكد الاستلام ونحدد تاريخ إرجاع يناسبك. لا تستعجل — نريدك أن تستمتع بكل صفحة بالسرعة التي تناسبك.</p>

<h3>5. اقرأ واستمتع</h3>
<p>خذ كتابك إلى المنزل وانغمس في عالم الأدب العربي الرائع. سواء كانت قصة قبل النوم، أو مغامرة في عطلة نهاية الأسبوع، أو رحلة تعليمية — استمتع بكل لحظة مع كتابك.</p>

<h3>6. أعد الكتاب واستعر المزيد</h3>
<p>عندما تنتهي من القراءة، ببساطة أعد الكتاب إلى أي من فروعنا. وإليك الجزء الأفضل — مع اشتراكك الشهري، يمكنك استعارة <strong>كتب غير محدودة</strong>! أعد واحداً واستلم آخر فوراً. لا يوجد حد لعدد الكتب التي يمكنك الاستمتاع بها.</p>

<h2>لماذا تشترك؟</h2>
<ul>
<li><strong>استعارة غير محدودة</strong> — اقرأ عدداً غير محدود من الكتب، واحداً تلو الآخر</li>
<li><strong>بأسعار معقولة</strong> — رسوم شهرية بسيطة تمنحك وصولاً لمجموعتنا الكاملة</li>
<li><strong>فروع متعددة</strong> — استعر من أي فرع وأعد إلى أي فرع</li>
<li><strong>مجموعة متنامية</strong> — نضيف كتباً جديدة بانتظام لإبقاء الأمور مميزة</li>
<li><strong>تذكيرات بالبريد الإلكتروني</strong> — سنذكرك بمواعيد الاستلام والإرجاع</li>
<li><strong>مناسب للعائلات</strong> — اشتراك واحد يغطي العائلة بأكملها</li>
</ul>

<blockquote>ابدأ مغامرتك في القراءة اليوم — تصفح كتالوجنا واحجز كتابك الأول!</blockquote>`,

      content_nl: `<h2>Uw Leesreis in 6 Eenvoudige Stappen</h2>
<p>Beginnen met de Arabische Jeugdbibliotheek is eenvoudig en betaalbaar. Hier leest u hoe u uw reis in de prachtige wereld van Arabische boeken kunt beginnen:</p>

<h3>1. Blader Door Onze Catalogus</h3>
<p>Verken onze uitgebreide online catalogus vanuit het comfort van uw huis. Filter boeken op categorie — van klassieke verhalen en avonturenverhalen tot educatieve bronnen en islamitische literatuur. Vind het perfecte boek dat past bij uw interesses of het leesniveau van uw kind.</p>

<h3>2. Reserveer Uw Boek</h3>
<p>Een boek gevonden dat u leuk vindt? Klik gewoon op "Reserveren" en kies een handig ophaaltijdstip. Vul uw gegevens in en u ontvangt een bevestigingsmail met alle informatie die u nodig heeft. Zo simpel is het!</p>

<h3>3. Bezoek Uw Locatie & Abonneer</h3>
<p>Kom naar het gekozen bibliotheekfiliaal op het geplande tijdstip. Bij uw <strong>eerste bezoek</strong> schrijft u zich in voor ons maandabonnement — een klein, betaalbaar bedrag dat u onbeperkt toegang geeft tot onze hele collectie. Ons vriendelijke personeel begeleidt u door het snelle registratieproces.</p>

<h3>4. Haal Uw Boek Op</h3>
<p>Haal uw gereserveerde boek op en het is helemaal van u om van te genieten! We bevestigen de ophaling en stellen een retourdatum in die voor u werkt. Geen haast — we willen dat u van elke pagina geniet op uw eigen tempo.</p>

<h3>5. Lees & Geniet</h3>
<p>Neem uw boek mee naar huis en duik in de prachtige wereld van de Arabische literatuur. Of het nu een verhaaltje voor het slapengaan is, een weekendavontuur of een educatieve reis — geniet van elk moment met uw boek.</p>

<h3>6. Retourneer & Leen Meer</h3>
<p>Als u klaar bent met lezen, breng het boek gewoon terug naar een van onze locaties. En hier komt het beste deel — met uw maandabonnement kunt u <strong>onbeperkt boeken</strong> lenen! Breng er een terug en haal meteen een ander op. Er is geen limiet aan het aantal boeken waar u van kunt genieten.</p>

<h2>Waarom Abonneren?</h2>
<ul>
<li><strong>Onbeperkt Lenen</strong> — Lees zoveel boeken als u wilt, één per keer</li>
<li><strong>Betaalbaar</strong> — Een klein maandelijks bedrag geeft u toegang tot onze hele collectie</li>
<li><strong>Meerdere Locaties</strong> — Leen bij elk filiaal, retourneer bij elk filiaal</li>
<li><strong>Groeiende Collectie</strong> — We voegen regelmatig nieuwe boeken toe</li>
<li><strong>E-mailherinneringen</strong> — We herinneren u aan ophaal- en retourdatums</li>
<li><strong>Gezinsvriendelijk</strong> — Eén abonnement dekt het hele gezin</li>
</ul>

<blockquote>Begin vandaag nog uw leesavontuur — blader door onze catalogus en reserveer uw eerste boek!</blockquote>`,
    });
    console.log('How It Works page content seeded');

    console.log('\nSeed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDB();

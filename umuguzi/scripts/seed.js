/**
 * UMUGUZIPRO DATABASE SEED SCRIPT
 * ----------------------------------------------------------------------------
 * Populates Super Admin (benirabok@gmail.com), Rwandan Gospel Choirs,
 * Rwandan Cinema & Films, channels, services, products, and site settings.
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Umuguzipro database seed...");

  // 1. Seed Dynamic Site Settings & Brand Customization
  console.log("-> Seeding Site Settings & Dynamic Platform Controls...");
  const defaultSettings = [
    { key: "app_name", value: "Umuguzipro", category: "BRANDING" },
    { key: "app_tagline", value: "Rwanda & Global Video, Creative Services and Commerce Platform", category: "BRANDING" },
    { key: "logo_url", value: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80", category: "BRANDING" },
    { key: "favicon_url", value: "/favicon.ico", category: "BRANDING" },
    { key: "brand_primary", value: "#2563eb", category: "BRANDING" },
    { key: "brand_primary_hover", value: "#1d4ed8", category: "BRANDING" },
    { key: "brand_accent", value: "#0ea5e9", category: "BRANDING" },
    { key: "contact_email", value: "benirabok@gmail.com", category: "CONTACT" },
    { key: "contact_phone", value: "+250 788 000 111", category: "CONTACT" },
    { key: "contact_address", value: "KN 4 Ave, Kigali City Tower, Kigali, Rwanda", category: "CONTACT" },
    { key: "social_youtube", value: "https://youtube.com/@umuguzi", category: "SOCIAL" },
    { key: "social_twitter", value: "https://x.com/umuguzi", category: "SOCIAL" },
    { key: "social_instagram", value: "https://instagram.com/umuguzi", category: "SOCIAL" },
    { key: "social_whatsapp", value: "https://wa.me/250788000111", category: "SOCIAL" },
    { key: "currency", value: "RWF", category: "PAYMENTS" },
    { key: "commission_rate", value: "10", category: "PAYMENTS" },
    { key: "referral_system_enabled", value: "true", category: "GENERAL" },
    { key: "multilevel_referral_enabled", value: "true", category: "GENERAL" },
    { key: "referral_commission_rate", value: "5", category: "PAYMENTS" },
    { key: "multilevel_level2_rate", value: "3", category: "PAYMENTS" },
    { key: "multilevel_level3_rate", value: "1", category: "PAYMENTS" },
    { key: "flutterwave_enabled", value: "true", category: "PAYMENTS" },
    { key: "flutterwave_public_key", value: "FLWPUBK_TEST-SANDBOX-KEY-12345", category: "PAYMENTS" },
    { key: "flutterwave_secret_key", value: "FLWSECK_TEST-SANDBOX-KEY-67890", category: "PAYMENTS" },
    { key: "manual_payment_enabled", value: "true", category: "PAYMENTS" },
    { key: "manual_payment_instructions", value: "Send payment via MTN Mobile Money or Airtel Money to +250 788 000 111 (Umuguzipro Ltd) or Bank Transfer to Bank of Kigali Account 00012345678. Reference your Booking/Order ID.", category: "PAYMENTS" },
    { key: "manual_payment_account_name", value: "Umuguzipro Ltd", category: "PAYMENTS" },
    { key: "manual_payment_account_number", value: "+250 788 000 111 (MoMo) / 00012345678 (BK)", category: "PAYMENTS" },
    { key: "storage_provider", value: "GOOGLE_DRIVE", category: "GENERAL" },
    { key: "google_drive_auto_failover", value: "true", category: "GENERAL" },
  ];

  for (const s of defaultSettings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  // 2. Seed Primary Super Admin: benirabok@gmail.com (Password: 1202!birthDATE)
  console.log("-> Seeding Super Admin (benirabok@gmail.com / 1202!birthDATE)...");
  const superAdminPasswordHash = await bcrypt.hash("1202!birthDATE", 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: "benirabok@gmail.com" },
    update: {
      passwordHash: superAdminPasswordHash,
      role: "SUPER_ADMIN",
      isVerified: true,
      twoFactorEnabled: false,
    },
    create: {
      email: "benirabok@gmail.com",
      username: "benir",
      displayName: "Benir Benjamin",
      passwordHash: superAdminPasswordHash,
      role: "SUPER_ADMIN",
      isVerified: true,
      twoFactorEnabled: false,
      country: "Rwanda",
      city: "Kigali",
      wallet: {
        create: {
          availableBalance: 5000000,
          pendingBalance: 0,
          totalEarnings: 5000000,
          totalWithdrawn: 0,
          currency: "RWF",
        },
      },
    },
  });

  // Channel for Super Admin Benir
  await prisma.channel.upsert({
    where: { handle: "benir" },
    update: {},
    create: {
      ownerId: superAdmin.id,
      name: "Benir Official",
      handle: "benir",
      description: "Official channel of Benir Benjamin on Umuguzipro.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
      subscriberCount: 35000,
      totalViews: 650000,
      isVerified: true,
    },
  });

  // 3. Seed Featured Gospel Choir Creator & Film Studio Users
  console.log("-> Seeding Gospel Choir & Film Creator Accounts...");
  const creatorPasswordHash = await bcrypt.hash("Creator@123456", 10);

  // Ambassadors of Christ Creator
  const ambassadorsUser = await prisma.user.upsert({
    where: { email: "ambassadors@umuguzi.pro" },
    update: {},
    create: {
      email: "ambassadors@umuguzi.pro",
      username: "ambassadorsofchrist",
      displayName: "Ambassadors of Christ Choir",
      passwordHash: creatorPasswordHash,
      role: "ARTIST",
      isVerified: true,
      country: "Rwanda",
      city: "Kigali",
      wallet: { create: { availableBalance: 850000, totalEarnings: 850000, currency: "RWF" } },
    },
  });

  const ambassadorsChannel = await prisma.channel.upsert({
    where: { handle: "ambassadorsofchrist" },
    update: {},
    create: {
      ownerId: ambassadorsUser.id,
      name: "Ambassadors of Christ Choir",
      handle: "ambassadorsofchrist",
      description: "Official YouTube Channel of Ambassadors of Christ Choir, Seventh-day Adventist Church Remera, Kigali Rwanda.",
      avatar: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80",
      subscriberCount: 890000,
      totalViews: 45000000,
      isVerified: true,
    },
  });

  // Israel Mbonyi Creator
  const mbonyiUser = await prisma.user.upsert({
    where: { email: "israelmbonyi@umuguzi.pro" },
    update: {},
    create: {
      email: "israelmbonyi@umuguzi.pro",
      username: "israelmbonyi",
      displayName: "Israel Mbonyi Official",
      passwordHash: creatorPasswordHash,
      role: "ARTIST",
      isVerified: true,
      country: "Rwanda",
      city: "Kigali",
      wallet: { create: { availableBalance: 1200000, totalEarnings: 1200000, currency: "RWF" } },
    },
  });

  const mbonyiChannel = await prisma.channel.upsert({
    where: { handle: "israelmbonyi" },
    update: {},
    create: {
      ownerId: mbonyiUser.id,
      name: "Israel Mbonyi",
      handle: "israelmbonyi",
      description: "Gospel recording artist and songwriter from Kigali, Rwanda. Nina Siri, Yanteruye, Sikiliza.",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
      subscriberCount: 1450000,
      totalViews: 98000000,
      isVerified: true,
    },
  });

  // Afrifame Pictures (Rwandan Cinema & Films)
  const afrifameUser = await prisma.user.upsert({
    where: { email: "afrifame@umuguzi.pro" },
    update: {},
    create: {
      email: "afrifame@umuguzi.pro",
      username: "afrifame",
      displayName: "Afrifame Pictures Rwanda",
      passwordHash: creatorPasswordHash,
      role: "CREATOR",
      isVerified: true,
      country: "Rwanda",
      city: "Kigali",
      wallet: { create: { availableBalance: 650000, totalEarnings: 650000, currency: "RWF" } },
    },
  });

  const afrifameChannel = await prisma.channel.upsert({
    where: { handle: "afrifame" },
    update: {},
    create: {
      ownerId: afrifameUser.id,
      name: "Afrifame Pictures (Filime Nyarwanda)",
      handle: "afrifame",
      description: "Rwanda's leading film production company. Producers of Seburikoko, City Maid, and Rwandan Cinema.",
      avatar: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=200&auto=format&fit=crop&q=80",
      subscriberCount: 520000,
      totalViews: 28000000,
      isVerified: true,
    },
  });

  // Zacu TV / Bamenya
  const zacuUser = await prisma.user.upsert({
    where: { email: "zacu@umuguzi.pro" },
    update: {},
    create: {
      email: "zacu@umuguzi.pro",
      username: "zacutv",
      displayName: "Zacu Entertainment & Films",
      passwordHash: creatorPasswordHash,
      role: "CREATOR",
      isVerified: true,
      country: "Rwanda",
      city: "Kigali",
      wallet: { create: { availableBalance: 490000, totalEarnings: 490000, currency: "RWF" } },
    },
  });

  const zacuChannel = await prisma.channel.upsert({
    where: { handle: "zacutv" },
    update: {},
    create: {
      ownerId: zacuUser.id,
      name: "Zacu Entertainment TV",
      handle: "zacutv",
      description: "Home of Rwandan blockbuster movies, Bamenya Series, and top comedy theatre in Kigali.",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      subscriberCount: 680000,
      totalViews: 39000000,
      isVerified: true,
    },
  });

  // 4. Seed Categories
  console.log("-> Seeding Video Categories (Gospel Choirs, Films, Music, Culture)...");
  const categoriesData = [
    { name: "Music & Performing Arts", slug: "music", type: "VIDEO" },
    { name: "Gospel Choirs & Praise", slug: "gospel", type: "VIDEO" },
    { name: "Rwandan Cinema & Films", slug: "films", type: "VIDEO" },
    { name: "Entertainment & Comedy", slug: "entertainment", type: "VIDEO" },
    { name: "Culture & Travel Rwanda", slug: "culture-travel", type: "VIDEO" },
    { name: "Technology & Software", slug: "technology", type: "VIDEO" },
    { name: "Education & Tutorials", slug: "education", type: "VIDEO" },
    { name: "Photography & Videography", slug: "photography-services", type: "SERVICE" },
    { name: "Web & Mobile Development", slug: "web-development", type: "SERVICE" },
    { name: "Music Production & Audio", slug: "music-production", type: "SERVICE" },
    { name: "Event Planning & Hosting", slug: "event-services", type: "SERVICE" },
    { name: "Video LUTs & Presets", slug: "presets", type: "PRODUCT" },
    { name: "Audio Stems & Sound Packs", slug: "sound-packs", type: "PRODUCT" },
    { name: "eBooks & Creator Guides", slug: "ebooks", type: "PRODUCT" },
  ];

  const categoryMap = {};
  for (const cat of categoriesData) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categoryMap[cat.slug] = c.id;
  }

  // 5. Seed Real Rwandan Gospel Choirs & Rwandan Cinema Videos
  console.log("-> Seeding Real Rwanda YouTube Gospel Choirs and Films...");
  const realRwandaVideos = [
    // GOSPEL CHOIRS & ARTISTS
    {
      title: "KWETU PAZURI by Ambassadors of Christ Choir (Official Video 4K)",
      slug: "ambassadors-of-christ-kwetu-pazuri",
      description: "Official iconic gospel video by Ambassadors of Christ Choir in Kigali, Rwanda. Sung with passion and traditional harmonies.",
      videoUrl: "https://www.youtube.com/watch?v=J_QGkWDk4Hk",
      thumbnailUrl: "https://img.youtube.com/vi/J_QGkWDk4Hk/hqdefault.jpg",
      duration: 375,
      views: 12500000,
      likes: 85000,
      accessType: "PUBLIC",
      price: 0,
      categorySlug: "music",
      channelId: ambassadorsChannel.id,
      userId: ambassadorsUser.id,
    },
    {
      title: "ISRAEL MBONYI - NINA SIRI (Official Music Video)",
      slug: "israel-mbonyi-nina-siri",
      description: "Breathtaking praise and worship song performed live in Kigali by Israel Mbonyi. Celebrated across East Africa.",
      videoUrl: "https://www.youtube.com/watch?v=92x0t5p57_k",
      thumbnailUrl: "https://img.youtube.com/vi/92x0t5p57_k/hqdefault.jpg",
      duration: 320,
      views: 48900000,
      likes: 310000,
      accessType: "PUBLIC",
      price: 0,
      categorySlug: "music",
      channelId: mbonyiChannel.id,
      userId: mbonyiUser.id,
    },
    {
      title: "TURAKWEMEYE by Alarm Ministries Rwanda (Official 4K Video)",
      slug: "alarm-ministries-turakwemeye",
      description: "Powerful choir worship praise session recorded in Kigali, Rwanda by Alarm Ministries.",
      videoUrl: "https://www.youtube.com/watch?v=kG6-1eX84mY",
      thumbnailUrl: "https://img.youtube.com/vi/kG6-1eX84mY/hqdefault.jpg",
      duration: 490,
      views: 3400000,
      likes: 42000,
      accessType: "PUBLIC",
      price: 0,
      categorySlug: "music",
      channelId: ambassadorsChannel.id,
      userId: ambassadorsUser.id,
    },
    {
      title: "AMASHIMWE by Healing Worship Team Kigali",
      slug: "healing-worship-amashimwe",
      description: "Live thanksgiving worship session by Healing Worship Team Kigali with full live band.",
      videoUrl: "https://www.youtube.com/watch?v=zJg5g0xR7gM",
      thumbnailUrl: "https://img.youtube.com/vi/zJg5g0xR7gM/hqdefault.jpg",
      duration: 440,
      views: 2800000,
      likes: 36000,
      accessType: "PUBLIC",
      price: 0,
      categorySlug: "music",
      channelId: ambassadorsChannel.id,
      userId: ambassadorsUser.id,
    },
    {
      title: "NIMUSINGIZE NYAGASANI - Chorale de Kigali (Official Concert)",
      slug: "chorale-de-kigali-nimusingize-nyagasani",
      description: "Prestigious classical choral concert performance by Chorale de Kigali at Kigali Serena Hotel.",
      videoUrl: "https://www.youtube.com/watch?v=V12j7uQ_K6U",
      thumbnailUrl: "https://img.youtube.com/vi/V12j7uQ_K6U/hqdefault.jpg",
      duration: 380,
      views: 1900000,
      likes: 27000,
      accessType: "PUBLIC",
      price: 0,
      categorySlug: "music",
      channelId: ambassadorsChannel.id,
      userId: ambassadorsUser.id,
    },
    {
      title: "ISRAEL MBONYI - YANTERUYE (Official Live Video)",
      slug: "israel-mbonyi-yanteruye",
      description: "Live energetic praise and dance anthem at BK Arena Kigali by Israel Mbonyi.",
      videoUrl: "https://www.youtube.com/watch?v=sI9pP3T34tQ",
      thumbnailUrl: "https://img.youtube.com/vi/sI9pP3T34tQ/hqdefault.jpg",
      duration: 410,
      views: 18500000,
      likes: 195000,
      accessType: "PUBLIC",
      price: 0,
      categorySlug: "music",
      channelId: mbonyiChannel.id,
      userId: mbonyiUser.id,
    },
    {
      title: "BUZIMA by Enihakore Choir CEP-UR Huye (Official Video)",
      slug: "enihakore-choir-buzima",
      description: "Heartwarming gospel message by Enihakore Choir University of Rwanda (CEP-UR Huye campus).",
      videoUrl: "https://www.youtube.com/watch?v=N6WnQG5-Foc",
      thumbnailUrl: "https://img.youtube.com/vi/N6WnQG5-Foc/hqdefault.jpg",
      duration: 520,
      views: 890000,
      likes: 16000,
      accessType: "PUBLIC",
      price: 0,
      categorySlug: "music",
      channelId: ambassadorsChannel.id,
      userId: ambassadorsUser.id,
    },

    // RWANDAN CINEMA & FILMS
    {
      title: "SEBURIKOKO Episode 1 - Afrifame Pictures (Filime Nyarwanda)",
      slug: "seburikoko-episode-1",
      description: "The acclaimed Rwandan television drama and film series produced by Afrifame Pictures in Kigali.",
      videoUrl: "https://www.youtube.com/watch?v=8q-w0O0V6gY",
      thumbnailUrl: "https://img.youtube.com/vi/8q-w0O0V6gY/hqdefault.jpg",
      duration: 1560,
      views: 1890000,
      likes: 48000,
      accessType: "PUBLIC",
      price: 0,
      categorySlug: "films",
      channelId: afrifameChannel.id,
      userId: afrifameUser.id,
    },
    {
      title: "BAMENYA SERIES Episode 1 - Rwandan Comedy & Drama Film",
      slug: "bamenya-series-episode-1",
      description: "Starring Ramadhan (Bamenya) in Rwanda's most trending contemporary comedy and family drama film series.",
      videoUrl: "https://www.youtube.com/watch?v=P6jW8pW1Y8E",
      thumbnailUrl: "https://img.youtube.com/vi/P6jW8pW1Y8E/hqdefault.jpg",
      duration: 1420,
      views: 2450000,
      likes: 62000,
      accessType: "PUBLIC",
      price: 0,
      categorySlug: "films",
      channelId: zacuChannel.id,
      userId: zacuUser.id,
    },
    {
      title: "CITY MAID Season 1 Episode 1 - Inyarwanda & Zacu Entertainment",
      slug: "city-maid-season-1-ep-1",
      description: "The captivating story of urban life, dreams, struggles, and triumph in the streets of Kigali.",
      videoUrl: "https://www.youtube.com/watch?v=4fV2f8vO6kA",
      thumbnailUrl: "https://img.youtube.com/vi/4fV2f8vO6kA/hqdefault.jpg",
      duration: 1680,
      views: 3100000,
      likes: 71000,
      accessType: "PUBLIC",
      price: 0,
      categorySlug: "films",
      channelId: afrifameChannel.id,
      userId: afrifameUser.id,
    },
    {
      title: "PAPA SAVA Ep 1: Niyitegeka Gratien (Full Comedy Movie Rwanda)",
      slug: "papa-sava-episode-1",
      description: "Gratien Niyitegeka's beloved comedy theatre production depicting everyday humor and Rwandan wit.",
      videoUrl: "https://www.youtube.com/watch?v=Q8lEwR-U_Lg",
      thumbnailUrl: "https://img.youtube.com/vi/Q8lEwR-U_Lg/hqdefault.jpg",
      duration: 980,
      views: 1450000,
      likes: 39000,
      accessType: "PUBLIC",
      price: 0,
      categorySlug: "films",
      channelId: zacuChannel.id,
      userId: zacuUser.id,
    },
    {
      title: "THE DAY OF MY RETURN (Umunsi Wo Kugaruka) - Rwandan Action Feature Film",
      slug: "the-day-of-my-return-rwandan-action-film",
      description: "Full-length Rwandan cinematic action film produced on location in Rubavu and Kigali.",
      videoUrl: "https://www.youtube.com/watch?v=6e6f_W64bV0",
      thumbnailUrl: "https://img.youtube.com/vi/6e6f_W64bV0/hqdefault.jpg",
      duration: 4200,
      views: 890000,
      likes: 24000,
      accessType: "PUBLIC",
      price: 0,
      categorySlug: "films",
      channelId: afrifameChannel.id,
      userId: afrifameUser.id,
    },

    // FOR-SALE / PREMIUM VIDEO (Watch preview free, Buy to download HD file)
    {
      title: "RWANDAN CINEMA & 4K PRODUCTION MASTERCLASS [Buy to Download HD]",
      slug: "rwandan-cinema-4k-masterclass-premium",
      description: "Complete masterclass on film directing, audio recording, and color grading in Rwanda. Stream the preview freely, or buy to unlock permanent HD download rights.",
      videoUrl: "https://www.youtube.com/watch?v=N7p-6qR2vYs",
      thumbnailUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&auto=format&fit=crop&q=80",
      duration: 3600,
      views: 45000,
      likes: 3800,
      accessType: "PREMIUM",
      price: 2500,
      categorySlug: "films",
      channelId: afrifameChannel.id,
      userId: afrifameUser.id,
    },
  ];

  for (const v of realRwandaVideos) {
    const existing = await prisma.video.findUnique({ where: { slug: v.slug } });
    if (!existing) {
      await prisma.video.create({
        data: {
          channelId: v.channelId,
          userId: v.userId,
          title: v.title,
          slug: v.slug,
          description: v.description,
          videoUrl: v.videoUrl,
          thumbnailUrl: v.thumbnailUrl,
          duration: v.duration,
          views: v.views,
          likes: v.likes,
          accessType: v.accessType,
          price: v.price || 0,
          status: "APPROVED",
          categoryId: categoryMap[v.categorySlug] || categoryMap["music"],
        },
      });
    }
  }

  // 6. Seed Digital Products
  console.log("-> Seeding Digital Marketplace Products...");
  const sampleProducts = [
    {
      title: "Cinematic Rwanda Video LUTs Color Grading Pack (DaVinci & Premiere)",
      slug: "cinematic-rwanda-luts-pack",
      description: "12 custom LUTs calibrated specifically for African sunlight, lush green hills, and vibrant skin tones.",
      price: 15000,
      fileType: "ZIP",
      fileSize: "45 MB",
      salesCount: 48,
      rating: 5.0,
      images: ["https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800"],
      downloadUrl: "https://example.com/downloads/rwanda-luts-pack.zip",
      categorySlug: "presets",
      sellerId: superAdmin.id,
    },
    {
      title: "East African Modern Afro-Fusion Drum Loops & Stems Pack",
      slug: "east-african-afro-fusion-drum-pack",
      description: "Royalty-free high-definition drum loops, shakers, inanga rhythms, and basslines.",
      price: 20000,
      fileType: "WAV / ZIP",
      fileSize: "280 MB",
      salesCount: 31,
      rating: 4.9,
      images: ["https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800"],
      downloadUrl: "https://example.com/downloads/afro-fusion-pack.zip",
      categorySlug: "sound-packs",
      sellerId: mbonyiUser.id,
    },
    {
      title: "Kinyarwanda Film Scriptwriting & Directing Master Guide (eBook)",
      slug: "kinyarwanda-film-scriptwriting-guide",
      description: "Comprehensive 180-page guide on writing, casting, and producing independent films in Rwanda.",
      price: 8000,
      fileType: "PDF",
      fileSize: "18 MB",
      salesCount: 19,
      rating: 5.0,
      images: ["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800"],
      downloadUrl: "https://example.com/downloads/kinyarwanda-film-guide.pdf",
      categorySlug: "ebooks",
      sellerId: afrifameUser.id,
    },
  ];

  for (const p of sampleProducts) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (!existing) {
      await prisma.product.create({
        data: {
          sellerId: p.sellerId,
          title: p.title,
          slug: p.slug,
          description: p.description,
          price: p.price,
          fileType: p.fileType,
          fileSize: p.fileSize,
          salesCount: p.salesCount,
          rating: p.rating,
          images: p.images,
          downloadUrl: p.downloadUrl,
          categoryId: categoryMap[p.categorySlug],
        },
      });
    }
  }

  // 7. Seed Services
  console.log("-> Seeding Service Listings...");
  const sampleServices = [
    {
      title: "Wedding & Traditional Ceremony (Gusaba/Gukwa) Photography",
      slug: "wedding-gusaba-photography-kigali",
      description: "Full high-resolution photography coverage for civil weddings, Gusaba ceremonies, and evening receptions in Kigali and provinces.",
      price: 150000,
      priceType: "FIXED",
      location: "Kigali, Rwanda",
      rating: 5.0,
      reviewCount: 22,
      categorySlug: "photography-services",
      images: ["https://images.unsplash.com/photo-1519741497674-611481863552?w=800"],
      providerId: superAdmin.id,
    },
    {
      title: "Professional Vocal Recording & Studio Mixing (Afrobeats / Gospel)",
      slug: "vocal-recording-mixing-mastering",
      description: "Acoustically treated studio in Gisozi, Kigali equipped with Neumann mics, Pro Tools, and analog compressors.",
      price: 60000,
      priceType: "FIXED",
      location: "Gisozi, Kigali",
      rating: 5.0,
      reviewCount: 15,
      categorySlug: "music-production",
      images: ["https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800"],
      providerId: mbonyiUser.id,
    },
  ];

  for (const s of sampleServices) {
    const existing = await prisma.service.findUnique({ where: { slug: s.slug } });
    if (!existing) {
      await prisma.service.create({
        data: {
          providerId: s.providerId,
          title: s.title,
          slug: s.slug,
          description: s.description,
          price: s.price,
          priceType: s.priceType,
          location: s.location,
          rating: s.rating,
          reviewCount: s.reviewCount,
          status: "ACTIVE",
          images: s.images,
          categoryId: categoryMap[s.categorySlug],
        },
      });
    }
  }

  console.log("✅ Seed completed successfully! Super Admin: benirabok@gmail.com / 1202!birthDATE");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

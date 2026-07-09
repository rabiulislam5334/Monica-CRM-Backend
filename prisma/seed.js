require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

async function main() {
  console.log("Seeding database...");

  // Supabase-এর জন্য Adapter সেটআপ
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Supabase-এর জন্য দরকার
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // Clean existing data
    await prisma.contact.deleteMany();
    await prisma.user.deleteMany();

    const hashedPassword = await bcrypt.hash("password123", 10);

    const user = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        password: hashedPassword,
      },
    });

    console.log(`✅ Created user: ${user.email}`);

    const contactsData = [
      {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "01700000001",
        isFavorite: true,
        personalNote: "Met at the tech conference.",
      },
      {
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        phone: "01700000002",
        isFavorite: false,
        personalNote: null,
      },
      {
        firstName: "Michael",
        lastName: "Brown",
        email: "michael@example.com",
        phone: "01700000003",
        isFavorite: true,
        personalNote: "Follow up next month.",
      },
      {
        firstName: "Emily",
        lastName: "Davis",
        email: "emily@example.com",
        phone: "01700000004",
        isFavorite: false,
        personalNote: "Old college friend.",
      },
      {
        firstName: "David",
        lastName: "Wilson",
        email: "david@example.com",
        phone: "01700000005",
        isFavorite: false,
        personalNote: null,
      },
    ];

    for (const contact of contactsData) {
      await prisma.contact.create({
        data: { ...contact, userId: user.id },
      });
    }

    console.log(`✅ Created ${contactsData.length} contacts.`);
    console.log("🎉 Seeding finished successfully.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("❌ Seeding failed:", e);
  process.exit(1);
});

// const { PrismaClient } = require("@prisma/client");
// const { PrismaPg } = require("@prisma/adapter-pg"); // Change if using another DB
// const { Pool } = require("pg"); // For PostgreSQL
// const bcrypt = require("bcryptjs");

// async function main() {
//   console.log("Seeding database...");

//   // === Database Adapter Setup (Required in Prisma 7) ===
//   const pool = new Pool({
//     connectionString: process.env.DATABASE_URL,
//   });

//   const adapter = new PrismaPg(pool);
//   const prisma = new PrismaClient({ adapter });

//   try {
//     // Clean existing data
//     await prisma.contact.deleteMany();
//     await prisma.user.deleteMany();

//     // Create default test user
//     const hashedPassword = await bcrypt.hash("password123", 10);

//     const user = await prisma.user.create({
//       data: {
//         name: "Test User",
//         email: "test@example.com",
//         password: hashedPassword,
//       },
//     });

//     console.log(`✅ Created user: ${user.email}`);

//     // Create sample contacts
//     const contactsData = [
//       {
//         firstName: "John",
//         lastName: "Doe",
//         email: "john@example.com",
//         phone: "01700000001",
//         isFavorite: true,
//         personalNote: "Met at the tech conference.",
//       },
//       {
//         firstName: "Jane",
//         lastName: "Smith",
//         email: "jane@example.com",
//         phone: "01700000002",
//         isFavorite: false,
//         personalNote: null,
//       },
//       {
//         firstName: "Michael",
//         lastName: "Brown",
//         email: "michael@example.com",
//         phone: "01700000003",
//         isFavorite: true,
//         personalNote: "Follow up next month.",
//       },
//       {
//         firstName: "Emily",
//         lastName: "Davis",
//         email: "emily@example.com",
//         phone: "01700000004",
//         isFavorite: false,
//         personalNote: "Old college friend.",
//       },
//       {
//         firstName: "David",
//         lastName: "Wilson",
//         email: "david@example.com",
//         phone: "01700000005",
//         isFavorite: false,
//         personalNote: null,
//       },
//     ];

//     for (const contact of contactsData) {
//       await prisma.contact.create({
//         data: { ...contact, userId: user.id },
//       });
//     }

//     console.log(`✅ Created ${contactsData.length} contacts.`);
//     console.log("🎉 Seeding finished successfully.");
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// main().catch((e) => {
//   console.error("❌ Seeding failed:", e);
//   process.exit(1);
// });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();
  try {
    const hashedPassword = await bcrypt.hash('password123', 12);
    const user = await prisma.user.create({
      data: {
        name: "Test User 2",
        email: "test2@example.com",
        password: hashedPassword,
        role: "user",
        phone: "123",
        balance: 10000.0,
        savings: 2500.0,
        investments: 0.0,
        tier: "starter",
        avatar: "url",
        job: "Job",
        cards: {
          create: {
            number: "1234",
            name: "Test User 2",
            expiry: "09/30",
            cvv: "123",
            type: "visa",
            balance: 2000.0,
          },
        },
        notifications: {
          create: {
            title: "Welcome",
            message: "Hello",
            type: "success",
          },
        },
      },
    });
    console.log("Created user:", user);
  } catch (error) {
    console.error("Prisma error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

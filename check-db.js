const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const verifications = await prisma.verification.findMany();
  console.log("Verifications:", JSON.stringify(verifications, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

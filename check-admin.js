const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: 'admin@primewealth.com' } });
  if (!admin) {
    console.log('❌ Admin not found in database!');
    return;
  }
  console.log('✅ Admin found:', admin.email);
  console.log('   Role:', admin.role);
  console.log('   Status:', admin.status);
  console.log('   Hash prefix:', admin.password.substring(0, 20) + '...');

  const m1 = await bcrypt.compare('super_secure_admin_password', admin.password);
  const m2 = await bcrypt.compare('admin123', admin.password);
  console.log('\nPassword checks:');
  console.log('  super_secure_admin_password matches:', m1 ? '✅ YES' : '❌ NO');
  console.log('  admin123 matches:', m2 ? '✅ YES' : '❌ NO');

  const userCount = await prisma.user.count();
  console.log('\nTotal users in database:', userCount);
}

main()
  .catch(e => console.error('Error:', e))
  .finally(() => prisma.$disconnect());

import 'dotenv/config';
import { prisma } from './prisma';

async function main() {
  const admin = await prisma.user.upsert({
    where: { username: 'admin@gmail.com' },
    update: { password: 'admin@4321' },
    create: {
      username: 'admin@gmail.com',
      password: 'admin@4321',
    },
  });
  console.log('Admin user updated:', admin);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

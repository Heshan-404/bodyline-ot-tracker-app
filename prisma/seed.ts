import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = 'testpassword';
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await prisma.user.findUnique({
    where: { username: 'testuser' },
  });

  if (!existingUser) {
    await prisma.user.create({
      data: {
        username: 'testuser',
        passwordHash: hashedPassword,
        role: 'HR',
      },
    });
    console.log('Default user created: testuser');
  } else {
    console.log('Default user already exists: testuser');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

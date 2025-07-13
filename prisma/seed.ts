import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = 'testpassword';
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await prisma.user.findUnique({
    where: { username: 'testuser' },
  });

  // Create or update HR user
  const hrUser = await prisma.user.upsert({
    where: { username: 'hruser' },
    update: {
      passwordHash: hashedPassword,
      email: 'hr@example.com',
      role: 'HR',
    },
    create: {
      username: 'hruser',
      email: 'hr@example.com',
      passwordHash: hashedPassword,
      role: 'HR',
    },
  });
  console.log(`HR user created/updated: ${hrUser.username}`);

  // Create or update DGM user
  const dgmUser = await prisma.user.upsert({
    where: { username: 'dgmuser' },
    update: {
      passwordHash: hashedPassword,
      email: 'dgm@example.com',
      role: 'DGM',
    },
    create: {
      username: 'dgmuser',
      email: 'dgm@example.com',
      passwordHash: hashedPassword,
      role: 'DGM',
    },
  });
  console.log(`DGM user created/updated: ${dgmUser.username}`);

  // Create or update GM user
  const gmUser = await prisma.user.upsert({
    where: { username: 'gmuser' },
    update: {
      passwordHash: hashedPassword,
      email: 'gm@example.com',
      role: 'GM',
    },
    create: {
      username: 'gmuser',
      email: 'gm@example.com',
      passwordHash: hashedPassword,
      role: 'GM',
    },
  });
  console.log(`GM user created/updated: ${gmUser.username}`);

  // Create or update Security user
  const securityUser = await prisma.user.upsert({
    where: { username: 'securityuser' },
    update: {
      passwordHash: hashedPassword,
      email: 'security@example.com',
      role: 'SECURITY',
    },
    create: {
      username: 'securityuser',
      email: 'security@example.com',
      passwordHash: hashedPassword,
      role: 'SECURITY',
    },
  });
  console.log(`Security user created/updated: ${securityUser.username}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

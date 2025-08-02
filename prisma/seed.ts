import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = 'testpassword';
  const hashedPassword = await bcrypt.hash(password, 10);

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

  // Create or update Sections
  const cuttingSection = await prisma.section.upsert({
    where: { name: 'Cutting' },
    update: {},
    create: { name: 'Cutting' },
  });
  console.log(`Section created/updated: ${cuttingSection.name}`);

  const productionSection = await prisma.section.upsert({
    where: { name: 'Production' },
    update: {},
    create: { name: 'Production' },
  });
  console.log(`Section created/updated: ${productionSection.name}`);

  // Create or update Manager users and assign to sections
  const managerCutting = await prisma.user.upsert({
    where: { username: 'managercutting' },
    update: {
      passwordHash: hashedPassword,
      email: 'managercutting@example.com',
      role: 'MANAGER',
      sectionId: cuttingSection.id,
    },
    create: {
      username: 'managercutting',
      email: 'managercutting@example.com',
      passwordHash: hashedPassword,
      role: 'MANAGER',
      sectionId: cuttingSection.id,
    },
  });
  console.log(`Manager user created/updated: ${managerCutting.username} in ${cuttingSection.name}`);

  const managerProduction = await prisma.user.upsert({
    where: { username: 'managerproduction' },
    update: {
      passwordHash: hashedPassword,
      email: 'managerproduction@example.com',
      role: 'MANAGER',
      sectionId: productionSection.id,
    },
    create: {
      username: 'managerproduction',
      email: 'managerproduction@example.com',
      passwordHash: hashedPassword,
      role: 'MANAGER',
      sectionId: productionSection.id,
    },
  });
  console.log(`Manager user created/updated: ${managerProduction.username} in ${productionSection.name}`);

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
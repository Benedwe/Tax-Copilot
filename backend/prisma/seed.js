import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10)

  const user = await prisma.user.upsert({
    where: { email: 'demo@local' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@local',
      passwordHash,
      tin: 'TZ123456789',
    },
  })

  await prisma.taxReturn.createMany({
    data: [
      {
        userId: user.id,
        year: 2025,
        grossIncome: 50000,
        taxableIncome: 45000,
        totalDeductions: 5000,
        taxDue: 5000,
        taxPaid: 3000,
        balance: 2000,
      },
    ],
    skipDuplicates: true,
  })

  console.log('Seed complete')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

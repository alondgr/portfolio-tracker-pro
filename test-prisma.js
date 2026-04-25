const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.transaction.findMany()
  .then(txs => {
    console.log('Total transactions in DB:', txs.length);
    if (txs.length > 0) {
      console.log('Sample userId:', txs[0].userId);
    }
  })
  .catch(console.error)
  .finally(() => prisma.$disconnect());

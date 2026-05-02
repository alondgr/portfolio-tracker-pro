const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const transactions = await prisma.transaction.findMany();
  console.log('Total transactions:', transactions.length);
  if (transactions.length > 0) {
    console.log('Sample transaction:', transactions[0]);
    
    const uniqueSymbols = [...new Set(transactions.map(t => t.symbol))];
    console.log('Unique symbols:', uniqueSymbols);
    
    const minDate = new Date(Math.min(...transactions.map(t => new Date(t.date))));
    console.log('Min date:', minDate.toISOString());
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

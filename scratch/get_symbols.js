const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const txns = await prisma.transaction.findMany({ select: { symbol: true } });
  const watchlist = await prisma.watchlist.findMany({ select: { symbol: true } });
  const symbols = [...new Set([...txns.map(t => t.symbol), ...watchlist.map(w => w.symbol)])];
  console.log(symbols);
}

main().catch(console.error).finally(() => prisma.$disconnect());

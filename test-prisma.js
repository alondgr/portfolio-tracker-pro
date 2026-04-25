const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8');
const directUrlMatch = env.match(/DIRECT_URL="([^"]+)"/);
const dbUrlMatch = env.match(/DATABASE_URL="([^"]+)"/);
const directUrl = directUrlMatch ? directUrlMatch[1] : null;
const dbUrl = dbUrlMatch ? dbUrlMatch[1] : null;

const { PrismaClient } = require('@prisma/client');

async function testConnection(url, name) {
  console.log(`Testing ${name}...`);
  const prisma = new PrismaClient({
    datasources: { db: { url } }
  });
  try {
    await prisma.$connect();
    console.log(`${name} SUCCESS!`);
  } catch (e) {
    console.error(`${name} FAILED:`, e.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function run() {
  await testConnection(directUrl, 'DIRECT_URL');
  await testConnection(dbUrl, 'DATABASE_URL');
}

run();

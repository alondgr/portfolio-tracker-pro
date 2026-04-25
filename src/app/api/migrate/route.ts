import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Please sign in first. You must be signed in to migrate data to your account.', { status: 401 });
    }

    const HOLDINGS_PATH = path.join(process.cwd(), 'data', 'holdings.json');
    let fileContents;
    try {
      fileContents = await fs.readFile(HOLDINGS_PATH, 'utf8');
    } catch (e) {
      return NextResponse.json({ error: 'No holdings.json file found to migrate.' }, { status: 404 });
    }

    const { holdings = [] } = JSON.parse(fileContents);

    let txnsToInsert: any[] = [];

    holdings.forEach((h: any) => {
      if (h.transactions) {
        h.transactions.forEach((t: any) => {
          txnsToInsert.push({
            userId: userId,
            symbol: h.symbol.toUpperCase(),
            type: t.type || 'BUY',
            quantity: Number(t.quantity),
            avgBuyPrice: Number(t.price),
            date: t.date || new Date().toISOString().split('T')[0]
          });
        });
      }
    });

    if (txnsToInsert.length === 0) {
      return NextResponse.json({ message: 'No transactions found in JSON to migrate.' });
    }

    // Insert all into Prisma
    await prisma.transaction.createMany({
      data: txnsToInsert
    });

    return NextResponse.json({ 
      success: true, 
      message: `Successfully migrated ${txnsToInsert.length} transactions to your account!`,
      transactions: txnsToInsert
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

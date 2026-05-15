import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';
import yf from 'yahoo-finance2';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ watchlist: [] });

    const watchlistItems = await prisma.watchlist.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    if (watchlistItems.length === 0) {
      return NextResponse.json({ watchlist: [] });
    }

    const symbols = watchlistItems.map((item: any) => item.symbol);
    
    const yahooFinance = new (yf.YahooFinance || yf)();
    const quotes = await yahooFinance.quote(symbols);
    
    const quotesMap: Record<string, any> = {};
    if (Array.isArray(quotes)) {
      quotes.forEach((q: any) => quotesMap[q.symbol] = q);
    } else if (quotes) {
      quotesMap[(quotes as any).symbol] = quotes;
    }

    const enrichedWatchlist = watchlistItems.map((item: any) => {
      const q = quotesMap[item.symbol];
      return {
        id: item.id,
        symbol: item.symbol,
        name: q?.shortName || q?.longName || item.symbol,
        price: q?.regularMarketPrice || 0,
        change: q?.regularMarketChangePercent || 0,
        changeAbs: q?.regularMarketChange || 0,
        currency: q?.currency || 'USD'
      };
    });

    return NextResponse.json({ watchlist: enrichedWatchlist });
  } catch (error: any) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const body = await request.json();
    const { action, symbol, id } = body;

    if (action === 'add') {
      if (!symbol) return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
      
      const existing = await prisma.watchlist.findUnique({
        where: {
          userId_symbol: {
            userId,
            symbol: symbol.toUpperCase()
          }
        }
      });

      if (!existing) {
        await prisma.watchlist.create({
          data: {
            userId,
            symbol: symbol.toUpperCase()
          }
        });
      }
    } else if (action === 'remove') {
      if (id) {
        await prisma.watchlist.deleteMany({
          where: { id, userId }
        });
      } else if (symbol) {
        await prisma.watchlist.deleteMany({
          where: { symbol: symbol.toUpperCase(), userId }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in POST /api/watchlist:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

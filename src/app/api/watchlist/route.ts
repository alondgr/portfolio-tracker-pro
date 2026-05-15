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
    
    const quotesMap: Record<string, any> = {};
    await Promise.all(symbols.map(async (sym: string) => {
      try {
        const summary = await yahooFinance.quoteSummary(sym, { modules: ['price', 'assetProfile'] }) as any;
        quotesMap[sym] = {
          price: summary.price?.regularMarketPrice || 0,
          change: summary.price?.regularMarketChangePercent || 0,
          changeAbs: summary.price?.regularMarketChange || 0,
          name: summary.price?.shortName || summary.price?.longName || sym,
          currency: summary.price?.currency || 'USD',
          sector: summary.assetProfile?.sector || "Unknown",
          industry: summary.assetProfile?.industry || "Unknown",
        };
      } catch (e) {
        // Fallback to simple quote if quoteSummary fails
        try {
          const q = await yahooFinance.quote(sym);
          quotesMap[sym] = {
            price: q?.regularMarketPrice || 0,
            change: q?.regularMarketChangePercent || 0,
            changeAbs: q?.regularMarketChange || 0,
            name: q?.shortName || q?.longName || sym,
            currency: q?.currency || 'USD',
            sector: "Unknown",
            industry: "Unknown",
          };
        } catch (err) {}
      }
    }));

    const enrichedWatchlist = watchlistItems.map((item: any) => {
      const q = quotesMap[item.symbol];
      return {
        id: item.id,
        symbol: item.symbol,
        isStarred: item.isStarred,
        name: q?.name || item.symbol,
        price: q?.price || 0,
        change: q?.change || 0,
        changeAbs: q?.changeAbs || 0,
        currency: q?.currency || 'USD',
        sector: q?.sector || "Unknown",
        industry: q?.industry || "Unknown",
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
    } else if (action === 'star') {
      const starredCount = await prisma.watchlist.count({
        where: { userId, isStarred: true }
      });

      if (starredCount >= 3) {
        return NextResponse.json({ error: 'You can only star up to 3 stocks' }, { status: 400 });
      }

      if (id) {
        await prisma.watchlist.updateMany({
          where: { id, userId },
          data: { isStarred: true }
        });
      } else if (symbol) {
        await prisma.watchlist.updateMany({
          where: { symbol: symbol.toUpperCase(), userId },
          data: { isStarred: true }
        });
      }
    } else if (action === 'unstar') {
      if (id) {
        await prisma.watchlist.updateMany({
          where: { id, userId },
          data: { isStarred: false }
        });
      } else if (symbol) {
        await prisma.watchlist.updateMany({
          where: { symbol: symbol.toUpperCase(), userId },
          data: { isStarred: false }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in POST /api/watchlist:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

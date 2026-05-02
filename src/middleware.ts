import { authMiddleware } from '@clerk/nextjs';

export default authMiddleware({
  // Allow the home page and essential market data APIs to be public for "Ghost" users
  publicRoutes: [
    '/', 
    '/api/health', 
    '/api/price', 
    '/api/market-data', 
    '/api/exchange-rates',
    '/api/portfolio',
    '/api/performance'
  ]
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};

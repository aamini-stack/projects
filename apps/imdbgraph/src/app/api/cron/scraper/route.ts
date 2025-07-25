import { update } from '@/db/data/scraper';
import { after } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // No caching.

/**
 * This API is called once a day by vercel. Once called, it begins updating all
 * the database entries with new data from IMDB in the background (~10 min).
 */
export function GET(request: NextRequest) {
  // Authentication
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET?.toString() ?? ''}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use Next.js after() function for proper background processing
  // This is the recommended way for long-running tasks in serverless functions
  after(async () => {
    try {
      console.log('Starting daily database scraper update...');
      await update();
      console.log('Database scraper update completed successfully');
    } catch (error) {
      console.error('Database scraper update failed:', error);
    }
  });

  // Return immediately while the scraper runs in the background
  return NextResponse.json({
    success: true,
    message: 'Database scraper update scheduled',
    timestamp: new Date().toISOString(),
  });
}

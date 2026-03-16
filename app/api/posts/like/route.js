import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { logger, logRequest } from '@/lib/logger';

export async function POST(request) {
  const startTime = Date.now();
  try {
    const { postId } = await request.json();
    logger.debug('Like request received', { postId });

    const db = await getDb();
    const result = await db.collection('posts').updateOne(
      { _id: new ObjectId(postId) },
      { $inc: { likes: 1 } }
    );

    if (result.matchedCount === 0) {
      logger.warn('Like failed - post not found', { postId });
      logRequest(request, 404, Date.now() - startTime, { postId });
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    logger.info('Post liked successfully', { postId });
    logRequest(request, 200, Date.now() - startTime, { postId });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Like failed', { error: error.message, stack: error.stack });
    logRequest(request, 500, Date.now() - startTime, { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

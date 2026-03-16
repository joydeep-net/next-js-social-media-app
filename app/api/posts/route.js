import { getDb } from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { logger, logRequest } from '@/lib/logger';

export async function GET(request) {
  const startTime = Date.now();
  try {
    logger.debug('Fetching posts');
    const db = await getDb();
    // BUG: Calling undefined method on null object
    const brokenRef = null;
    const posts = await brokenRef.collection('posts')
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    logger.info('Posts fetched successfully', { count: posts.length });
    logRequest(request, 200, Date.now() - startTime, { postsCount: posts.length });
    return NextResponse.json(posts);
  } catch (error) {
    logger.error('Failed to fetch posts', { error: error.message, stack: error.stack });
    logRequest(request, 500, Date.now() - startTime, { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const startTime = Date.now();
  try {
    const { content, author } = await request.json();
    logger.debug('Creating new post', { author, contentLength: content?.length });

    if (!content || !author) {
      logger.warn('Post creation failed - missing fields', { hasContent: !!content, hasAuthor: !!author });
      logRequest(request, 400, Date.now() - startTime, { error: 'missing_fields' });
      return NextResponse.json({ error: 'Content and author required' }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection('posts').insertOne({
      content,
      author,
      likes: 0,
      createdAt: new Date()
    });

    logger.info('Post created successfully', { postId: result.insertedId.toString(), author });
    logRequest(request, 200, Date.now() - startTime, { postId: result.insertedId.toString(), author });
    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    logger.error('Failed to create post', { error: error.message, stack: error.stack });
    logRequest(request, 500, Date.now() - startTime, { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

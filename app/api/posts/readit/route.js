import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { logger, logRequest } from '@/lib/logger';

export async function GET(request) {
  const startTime = Date.now();
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      logRequest(request, 400, Date.now() - startTime, { error: 'missing_username' });
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    const db = await getDb();
    const bookmarks = await db.collection('bookmarks')
      .find({ username })
      .sort({ createdAt: -1 })
      .toArray();

    const postIds = bookmarks.map(b => new ObjectId(b.postId));
    let posts = [];
    if (postIds.length > 0) {
      posts = await db.collection('posts')
        .find({ _id: { $in: postIds } })
        .toArray();

      const postMap = new Map(posts.map(p => [p._id.toString(), p]));
      posts = bookmarks
        .map(b => postMap.get(b.postId))
        .filter(Boolean);
    }

    logger.info('Bookmarks fetched', { username, count: posts.length });
    logRequest(request, 200, Date.now() - startTime, { count: posts.length });
    return NextResponse.json(posts);
  } catch (error) {
    logger.error('Failed to fetch bookmarks', { error: error.message, stack: error.stack });
    logRequest(request, 500, Date.now() - startTime, { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const startTime = Date.now();
  try {
    const { postId, username } = await request.json();

    if (!postId || !username) {
      logRequest(request, 400, Date.now() - startTime, { error: 'missing_fields' });
      return NextResponse.json({ error: 'postId and username required' }, { status: 400 });
    }

    const db = await getDb();

    const existing = await db.collection('bookmarks').findOne({ postId, username });

    if (existing) {
      await db.collection('bookmarks').deleteOne({ _id: existing._id });
      logger.info('Bookmark removed', { postId, username });
      logRequest(request, 200, Date.now() - startTime, { postId, action: 'removed' });
      return NextResponse.json({ bookmarked: false });
    }

    await db.collection('bookmarks').insertOne({
      postId,
      username,
      createdAt: new Date()
    });

    logger.info('Bookmark added', { postId, username });
    logRequest(request, 200, Date.now() - startTime, { postId, action: 'added' });
    return NextResponse.json({ bookmarked: true });
  } catch (error) {
    logger.error('Bookmark failed', { error: error.message, stack: error.stack });
    logRequest(request, 500, Date.now() - startTime, { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

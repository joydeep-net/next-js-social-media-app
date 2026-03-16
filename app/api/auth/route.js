import { getDb } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { logger, logRequest } from '@/lib/logger';

export async function POST(request) {
  const startTime = Date.now();
  try {
    const { action, username, password } = await request.json();
    logger.debug('Auth request received', { action, username });

    const db = await getDb();
    const users = db.collection('users');

    if (action === 'register') {
      const existing = await users.findOne({ username });
      if (existing) {
        logger.warn('Registration failed - username taken', { username });
        logRequest(request, 400, Date.now() - startTime, { action, username });
        return NextResponse.json({ error: 'Username taken' }, { status: 400 });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      await users.insertOne({
        username,
        password: hashedPassword,
        createdAt: new Date()
      });
      logger.info('User registered successfully', { username });
      logRequest(request, 200, Date.now() - startTime, { action, username });
      return NextResponse.json({ success: true, username });
    }

    if (action === 'login') {
      const user = await users.findOne({ username });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        logger.warn('Login failed - invalid credentials', { username });
        logRequest(request, 401, Date.now() - startTime, { action, username });
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
      logger.info('User logged in successfully', { username });
      logRequest(request, 200, Date.now() - startTime, { action, username });
      return NextResponse.json({ success: true, username: user.username });
    }

    logger.warn('Invalid auth action', { action });
    logRequest(request, 400, Date.now() - startTime, { action });
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    logger.error('Auth error', { error: error.message, stack: error.stack });
    logRequest(request, 500, Date.now() - startTime, { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

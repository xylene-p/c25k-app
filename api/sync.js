import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const ONE_YEAR = 60 * 60 * 24 * 365;
const MAX_HISTORY = 100;

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type')
      .end();
  }

  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  try {
    if (req.method === 'GET') {
      const userId = req.query.userId;
      if (!userId || typeof userId !== 'string' || userId.length > 64) {
        return res.status(400).json({ error: 'Invalid userId' });
      }

      const data = await redis.get(`c25k:${userId}`);
      if (!data) {
        return res.status(200).json({ progress: {}, history: [] });
      }
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { userId, progress, history } = req.body;

      if (!userId || typeof userId !== 'string' || userId.length > 64) {
        return res.status(400).json({ error: 'Invalid userId' });
      }
      if (!progress || typeof progress !== 'object') {
        return res.status(400).json({ error: 'Invalid progress' });
      }
      if (!Array.isArray(history)) {
        return res.status(400).json({ error: 'Invalid history' });
      }

      const trimmedHistory = history.slice(0, MAX_HISTORY);

      await redis.set(`c25k:${userId}`, { progress, history: trimmedHistory }, { ex: ONE_YEAR });

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Sync error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

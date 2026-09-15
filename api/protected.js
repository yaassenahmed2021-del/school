import { kv } from '@vercel/kv';

const KEY = 'protected_students';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const list = (await kv.get(KEY)) || [];
      return res.status(200).json({ protected: Array.isArray(list) ? list : [] });
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (_) { body = {}; }
      }
      body = body || {};

      const { code, action } = body;
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'code required' });
      }

      let list = (await kv.get(KEY)) || [];
      if (!Array.isArray(list)) list = [];

      if (action === 'add') {
        if (!list.includes(code)) {
          list.push(code);
          await kv.set(KEY, list);
        }
      } else if (action === 'remove') {
        list = list.filter(c => c !== code);
        await kv.set(KEY, list);
      } else {
        return res.status(400).json({ error: 'action must be add or remove' });
      }

      return res.status(200).json({ protected: list });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('KV Error:', err);
    return res.status(500).json({
      error: 'Server error',
      details: err.message,
      hint: 'Make sure Vercel KV is connected and environment variables are set'
    });
  }
}

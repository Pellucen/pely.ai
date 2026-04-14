export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const { type } = req.body;

  // Health check — lightweight ping to verify API access
  if (type === 'health') {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }]
        })
      });
      if (response.ok) {
        return res.status(200).json({ status: 'ok' });
      }
      return res.status(502).json({ status: 'unavailable' });
    } catch (err) {
      return res.status(502).json({ status: 'unavailable' });
    }
  }

  // Chat — full conversational exchange
  if (type === 'chat') {
    const { system, messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 600,
          system: system || '',
          messages: messages
        })
      });

      if (!response.ok) {
        const err = await response.text();
        console.error('Anthropic API error:', err);
        return res.status(502).json({ error: 'API request failed' });
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || '';

      return res.status(200).json({ text });
    } catch (err) {
      console.error('Chat proxy error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  return res.status(400).json({ error: 'Invalid request type' });
}

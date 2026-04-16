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

    let text = '';

    try {
      // 1. TRY ANTHROPIC
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
        throw new Error(`Anthropic failed with status: ${response.status}`);
      }

      const data = await response.json();
      text = data.content?.[0]?.text || '';

    } catch (anthropicError) {
      console.warn('Anthropic API failed, falling back to Cerebras:', anthropicError.message);

      // 2. FALLBACK TO CEREBRAS
      const cerebrasKey = process.env.CEREBRAS_API_KEY;
      if (!cerebrasKey) {
        return res.status(500).json({ error: 'Primary API failed and no fallback configured.' });
      }

      try {
        const cerebrasMessages = system 
          ? [{ role: 'system', content: system }, ...messages] 
          : messages;

        const cerebrasResponse = await fetch('https://api.cerebras.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cerebrasKey}`
          },
          body: JSON.stringify({
            model: 'qwen-3-235b-a22b-instruct-2507',
            messages: cerebrasMessages,
            max_tokens: 600 
          })
        });

        if (!cerebrasResponse.ok) {
          const err = await cerebrasResponse.text();
          console.error('Cerebras fallback also failed:', err);
          return res.status(502).json({ error: 'Both primary and fallback APIs failed' });
        }

        const cerebrasData = await cerebrasResponse.json();
        text = cerebrasData.choices?.[0]?.message?.content || '';
      } catch (cerebrasError) {
        console.error('Cerebras fallback error:', cerebrasError.message);
        return res.status(500).json({ error: 'Internal error during fallback' });
      }
    }

    return res.status(200).json({ text });
  }

  return res.status(400).json({ error: 'Invalid request type' });
}
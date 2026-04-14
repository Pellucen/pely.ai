export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { businessName, industry, teamSize, timeSinks, tools, hoursPerWeek, hours, specificPain, idealTool } = req.body;

    let dynamicContext = '';
    if (specificPain) {
      dynamicContext += `\nTheir most painful repetitive task: ${specificPain}`;
    }
    if (idealTool) {
      dynamicContext += `\nWhat their ideal automated solution would do: ${idealTool}`;
    }

    const prompt = `You are a senior AI automation consultant at Pely.ai, a Manchester-based company that builds AI workflow tools for small businesses. Based on the following quiz answers, write a 3-4 sentence personalised recommendation about what you'd focus on automating first and why. Be specific — reference their industry, tools, and pain points by name.${specificPain ? ' Reference their specific pain point and how you would solve it.' : ''} Sound like a knowledgeable human giving advice over coffee, not a chatbot. Keep it under 80 words.

Business: ${businessName || 'Not provided'}
Industry: ${industry}
Team size: ${teamSize}
Biggest time sinks: ${timeSinks}
Current tools: ${tools}
Hours lost per week: ${hoursPerWeek || 15}
Estimated hours saveable: ${hours}/week${dynamicContext}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }]
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
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}

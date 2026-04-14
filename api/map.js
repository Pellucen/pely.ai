export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    let { workflow } = req.body;
    if (!workflow || typeof workflow !== 'string' || !workflow.trim()) {
      return res.status(400).json({ error: 'Please describe a workflow' });
    }
    workflow = workflow.trim().slice(0, 2000);

    const systemPrompt = `You are a senior AI automation consultant at Pellucen, a Manchester-based company that builds AI workflow tools for small businesses. The user will describe a business workflow. Parse it into discrete steps and analyse which can be automated.

Return ONLY valid JSON (no markdown fences, no commentary) in this exact structure:

{
  "workflow_name": "Short name for the workflow",
  "steps": [
    {
      "number": 1,
      "title": "Short step title",
      "description": "One sentence describing what happens",
      "automatable": true,
      "automation_method": "How it could be automated (e.g. 'Zapier webhook', 'AI email classifier', 'API integration')",
      "time_minutes": 5
    }
  ],
  "approval_points": [
    {
      "after_step": 3,
      "reason": "Short explanation of why a human should review or approve before the workflow continues"
    }
  ],
  "summary": {
    "total_steps": 6,
    "automatable_steps": 4,
    "total_time_minutes": 45,
    "saveable_time_minutes": 30
  },
  "recommendation": {
    "service": "AI Workflow Automation",
    "description": "One sentence on what Pellucen would build",
    "quick_win": "The single easiest step to automate first"
  }
}

Rules:
- Break the workflow into 4-8 concrete steps
- Be realistic about what is automatable vs truly manual
- time_minutes is per occurrence (not per week)
- automation_method should be specific and practical
- If a step is not automatable, set automatable to false and automation_method to "Manual — requires human judgement"
- quick_win should reference a specific step by name
- approval_points: identify 1-3 critical moments in the workflow where a human should review or approve before continuing. These are high-stakes checkpoints — e.g. before dispatching an order, before sending a client-facing document, before submitting a regulatory filing, before confirming a financial transaction, before acting on patient data. Use after_step to reference the step number after which approval should happen. Only include genuinely important checkpoints, not every manual step.`;


    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: workflow }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API error:', err);
      return res.status(502).json({ error: 'API request failed' });
    }

    const data = await response.json();
    let text = data.content?.[0]?.text || '';

    // Strip markdown fences if present
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error('Failed to parse AI response as JSON:', text);
      return res.status(502).json({ error: 'Invalid response from AI' });
    }

    // Basic validation
    if (!parsed.steps || !Array.isArray(parsed.steps) || parsed.steps.length === 0) {
      return res.status(502).json({ error: 'Invalid workflow structure' });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Map proxy error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}

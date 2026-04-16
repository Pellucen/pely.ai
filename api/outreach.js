export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth check
  const secret = process.env.OUTREACH_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'Outreach service not configured' });
  }

  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (token !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const cerebrasKey = process.env.CEREBRAS_API_KEY;

  const { recipients } = req.body || {};
  const subject = req.body?.subject || "Quick thought on {{company}}'s workflows";
  const body = req.body?.body || "We help independent professionals and small teams scale their output without scaling their payroll. We build you a custom, incredibly simple app dashboard and populate it with modular AI agents tailored to your exact workflows. Whether you need an agent to handle order processing, client outreach, or data entry, you can add as many capabilities as you need to get the operational capacity of a much larger team.";
  const cta_text = req.body?.cta_text || 'Book a call';
  const cta_url = req.body?.cta_url || 'https://pely.ai/#contact';
  const scheduledAt = req.body?.scheduledAt || null;

  if (!Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: 'recipients array is required' });
  }
  if (recipients.length > 100) {
    return res.status(400).json({ error: 'Maximum 100 recipients per request' });
  }

  // Generate personalised intros and guess names in parallel
  const [intros, guessedNames] = await Promise.all([
    Promise.all(recipients.map((r) => generateIntro(r, anthropicKey, cerebrasKey))),
    Promise.all(recipients.map((r) => r.name ? Promise.resolve(r.name) : guessName(r.email, anthropicKey, cerebrasKey)))
  ]);

  const emails = recipients.map((r, i) => {
    const name = guessedNames[i] || '';
    const firstName = name.split(' ')[0] || '';
    const company = r.company || '';
    const intro = intros[i];

    const personalise = (str) =>
      str
        .replace(/\{\{name\}\}/g, name)
        .replace(/\{\{firstName\}\}/g, firstName)
        .replace(/\{\{company\}\}/g, company);

    const personalSubject = personalise(subject);
    const personalBody = personalise(body);

    // Build full message: greeting + AI intro + body
    const greeting = `Hi ${firstName || 'there'},`;
    const introLine = `\n\n${intro || "How's your day going? I wanted to reach out — I think there's a real opportunity to save your team some serious time."}`;
    const fullBody = `${greeting}${introLine}\n\n${personalBody}`;

    // Convert newlines to <br> for HTML, escape first
    const bodyHtml = escapeHtml(fullBody).replace(/\n/g, '<br>');

    const ctaBlock = cta_text && cta_url
      ? `<a href="${escapeHtml(cta_url)}" style="display:inline-block;background:linear-gradient(135deg,#D0BC8A,#B0A070);color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;padding:10px 20px;border-radius:8px;">${escapeHtml(cta_text)}</a>`
      : '';

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F6F2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://pely.ai/pely-logo-email.png" alt="Pely.ai" width="48" height="48" style="display:block;margin:0 auto 12px;">
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:600;color:#1A1A1C;letter-spacing:0.5px;">Pely.ai</div>
    </div>

    <!-- Card -->
    <div style="background:#ffffff;border-radius:16px;padding:32px 28px;border:1px solid rgba(0,0,0,0.06);">
      <p style="font-size:15px;color:#4A4A52;line-height:1.7;margin:0 0 28px;">${bodyHtml}</p>

      <!-- ROI teaser -->
      <div style="border-top:1px solid rgba(0,0,0,0.06);padding-top:24px;margin-bottom:24px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#B0A070;margin-bottom:12px;">What teams like yours are saving</div>
        <div style="display:flex;gap:12px;margin-bottom:20px;">
          <div style="flex:1;text-align:center;padding:16px 8px;background:#F8F6F2;border-radius:12px;">
            <div style="font-size:28px;font-weight:700;color:#D0BC8A;">40%</div>
            <div style="font-size:11px;color:#7A7A84;margin-top:2px;">automatable</div>
          </div>
          <div style="flex:1;text-align:center;padding:16px 8px;background:#F8F6F2;border-radius:12px;">
            <div style="font-size:28px;font-weight:700;color:#1A1A1C;">12+</div>
            <div style="font-size:11px;color:#7A7A84;margin-top:2px;">hrs saved / week</div>
          </div>
          <div style="flex:1;text-align:center;padding:16px 8px;background:#F8F6F2;border-radius:12px;">
            <div style="font-size:28px;font-weight:700;color:#1A1A1C;">2 min</div>
            <div style="font-size:11px;color:#7A7A84;margin-top:2px;">to find out</div>
          </div>
        </div>
        <p style="font-size:14px;color:#4A4A52;line-height:1.6;margin:0 0 20px;">Take our free 2-minute discovery to see exactly where AI could save your team time — no commitment, just clarity.</p>
        <div style="text-align:center;">
          <a href="https://pely.ai/#discover" style="display:inline-block;background:linear-gradient(135deg,#D0BC8A,#B0A070);color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:10px;">Start your discovery</a>
        </div>
      </div>

      ${ctaBlock ? `
      <!-- Book a call -->
      <div style="border-top:1px solid rgba(0,0,0,0.06);padding-top:20px;text-align:center;">
        <p style="font-size:14px;color:#4A4A52;margin:0 0 16px;">Or if you prefer, book a call?</p>
        ${ctaBlock}
      </div>
      ` : ''}

      <!-- Signature -->
      <div style="border-top:1px solid rgba(0,0,0,0.06);padding-top:20px;margin-top:24px;">
        <table style="border:0;border-collapse:collapse;"><tr>
          <td style="vertical-align:middle;padding-right:16px;">
            <img src="https://pely.ai/headshot.png" alt="Joe Rigby" width="56" height="56" style="border-radius:50%;display:block;">
          </td>
          <td style="vertical-align:middle;">
            <div style="font-size:14px;font-weight:700;color:#1A1A1C;">Joe Rigby</div>
            <div style="font-size:13px;color:#7A7A84;">Founder, <a href="https://pely.ai" style="color:#B0A070;text-decoration:none;">Pely.ai</a> · Manchester, UK</div>
            <div style="font-size:11px;color:#B0A070;font-style:italic;margin-top:2px;">Built to empower, not replace.</div>
          </td>
        </tr></table>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:32px;">
      <p style="font-size:12px;color:#7A7A84;margin:0;">Pely.ai — workflow automation, Manchester</p>
      <p style="font-size:12px;color:#7A7A84;margin:4px 0 0;"><a href="https://pely.ai" style="color:#B0A070;text-decoration:none;">pely.ai</a></p>
      <p style="font-size:11px;color:#A0A0A8;margin:12px 0 0;"><a href="mailto:outreach@pely.ai?subject=Unsubscribe&body=Please%20remove%20me%20from%20future%20emails." style="color:#A0A0A8;text-decoration:underline;">Unsubscribe</a></p>
    </div>

  </div>
</body>
</html>`.trim();

    const email = {
      from: 'Pely.ai <info@pely.ai>',
      to: [r.email],
      reply_to: 'info@josephrigby.com',
      subject: personalSubject,
      html
    };
    if (scheduledAt) email.scheduledAt = scheduledAt;
    return email;
  });

  try {
    const response = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emails)
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      console.error('Resend batch API error:', response.status, errBody);
      return res.status(502).json({ error: 'Email delivery failed', detail: errBody });
    }

    const result = await response.json();
    const data = result.data || result;
    const sent = Array.isArray(data) ? data.length : recipients.length;

    return res.status(200).json({ success: true, sent, data });

  } catch (err) {
    console.error('Outreach send error:', err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
}

async function generateIntro(recipient, anthropicKey, cerebrasKey) {
  if (!anthropicKey && !cerebrasKey) return '';

  const domain = (recipient.email || '').split('@')[1];
  if (!domain) return '';

  // Fetch the company website
  let siteText = '';
  try {
    const resp = await fetch(`https://${domain}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(5000)
    });
    if (resp.ok) {
      const html = await resp.text();
      // Strip tags and grab first ~1500 chars of text
      siteText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1500);
    }
  } catch {
    // Website unreachable — fall back gracefully
  }

  if (!siteText) return '';

  const company = recipient.company || domain;
  let text = '';

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        system: "You output ONLY a single sentence. No explanations, no caveats, no questions, no preamble. If you cannot write a good sentence, output exactly: SKIP",
        messages: [{
          role: 'user',
          content: `Write one sentence (max 30 words) for a cold outreach email from Pely.ai (workflow automation). The sentence should reference something specific about ${company}'s business and hint at where automation could help. Based on their website:\n\n${siteText}`
        }]
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!resp.ok) throw new Error('Anthropic failed');
    const data = await resp.json();
    text = data.content?.[0]?.text?.trim();

  } catch (err) {
    if (!cerebrasKey) return '';
    try {
      const cResp = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cerebrasKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'zai-glm-4.7', // Requested fallback model
          messages: [
            { role: 'system', content: "You output ONLY a single sentence. No explanations, no caveats, no questions, no preamble. If you cannot write a good sentence, output exactly: SKIP" },
            { role: 'user', content: `Write one sentence (max 30 words) for a cold outreach email from Pely.ai (workflow automation). The sentence should reference something specific about ${company}'s business and hint at where automation could help. Based on their website:\n\n${siteText}` }
          ],
          max_tokens: 150
        }),
        signal: AbortSignal.timeout(10000)
      });
      if (cResp.ok) {
        const cData = await cResp.json();
        text = cData.choices?.[0]?.message?.content?.trim();
      }
    } catch (e) {}
  }

  if (text && text !== 'SKIP' && text.length < 200) return text;
  return '';
}

const GENERIC_PREFIXES = new Set([
  'info', 'hello', 'admin', 'contact', 'support', 'sales', 'team',
  'office', 'enquiries', 'enquiry', 'billing', 'accounts', 'help',
  'mail', 'no-reply', 'noreply', 'postmaster', 'webmaster'
]);

async function guessName(email, anthropicKey, cerebrasKey) {
  if (!email) return '';
  const prefix = email.split('@')[0].toLowerCase();
  if (GENERIC_PREFIXES.has(prefix)) return '';

  // If clearly separated (joe.rigby), use simple logic
  const parts = prefix.split(/[._-]+/).filter(p => p && !/^\d+$/.test(p));
  if (parts.length >= 2) {
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  }

  // Single chunk (e.g. "samueldrigby") — ask LLM
  if ((anthropicKey || cerebrasKey) && parts.length === 1 && parts[0].length > 3) {
    let text = '';
    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 30,
          system: "Extract the first name from this email prefix. Output ONLY the capitalised first name. If you can't find a real name, output exactly: SKIP",
          messages: [{ role: 'user', content: parts[0] }]
        }),
        signal: AbortSignal.timeout(5000)
      });
      if (!resp.ok) throw new Error('Anthropic failed');
      const data = await resp.json();
      text = data.content?.[0]?.text?.trim();

    } catch (err) {
      if (!cerebrasKey) return '';
      try {
        const cResp = await fetch('https://api.cerebras.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cerebrasKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'qwen-3-235b-a22b-instruct-2507', // Requested fallback model
            messages: [
              { role: 'system', content: "Extract the first name from this email prefix. Output ONLY the capitalised first name. If you can't find a real name, output exactly: SKIP" },
              { role: 'user', content: parts[0] }
            ],
            max_tokens: 100
          }),
          signal: AbortSignal.timeout(5000)
        });
        if (cResp.ok) {
          const cData = await cResp.json();
          text = cData.choices?.[0]?.message?.content?.trim();
        }
      } catch (e) {}
    }
    if (text && text !== 'SKIP' && text.length < 20) return text;
  }

  return '';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
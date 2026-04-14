export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const { to, name, company, workflowName, automationPct, weeklySaving, annualSaving, quickWin } = req.body || {};

  if (!to || typeof to !== 'string' || !to.includes('@')) {
    return res.status(400).json({ error: 'Valid email address required' });
  }

  const firstName = (name || 'there').split(' ')[0];
  const companyName = company || 'your team';

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

      <h1 style="font-size:22px;font-weight:700;color:#1A1A1C;margin:0 0 8px;">Your discovery results</h1>
      <p style="font-size:15px;color:#4A4A52;line-height:1.6;margin:0 0 24px;">Hi ${firstName}, thanks for completing your discovery session. Here's what we found for ${companyName}.</p>

      ${workflowName ? `
      <!-- Workflow -->
      <div style="margin-bottom:20px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#B0A070;margin-bottom:4px;">Workflow analysed</div>
        <div style="font-size:15px;color:#1A1A1C;font-weight:600;">${escapeHtml(workflowName)}</div>
      </div>
      ` : ''}

      <!-- Stats -->
      <div style="display:flex;gap:12px;margin-bottom:24px;">
        ${automationPct ? `<div style="flex:1;text-align:center;padding:16px 8px;background:#F8F6F2;border-radius:12px;">
          <div style="font-size:28px;font-weight:700;color:#D0BC8A;">${automationPct}%</div>
          <div style="font-size:11px;color:#7A7A84;margin-top:2px;">automatable</div>
        </div>` : ''}
        ${weeklySaving ? `<div style="flex:1;text-align:center;padding:16px 8px;background:#F8F6F2;border-radius:12px;">
          <div style="font-size:28px;font-weight:700;color:#1A1A1C;">${weeklySaving}</div>
          <div style="font-size:11px;color:#7A7A84;margin-top:2px;">hrs saved / week</div>
        </div>` : ''}
        ${annualSaving ? `<div style="flex:1;text-align:center;padding:16px 8px;background:#F8F6F2;border-radius:12px;">
          <div style="font-size:28px;font-weight:700;color:#1A1A1C;">${annualSaving}</div>
          <div style="font-size:11px;color:#7A7A84;margin-top:2px;">potential saving</div>
        </div>` : ''}
      </div>

      ${quickWin ? `
      <!-- Quick win -->
      <div style="background:linear-gradient(135deg,rgba(208,188,138,0.12),rgba(208,188,138,0.04));border:1px solid rgba(208,188,138,0.25);border-radius:12px;padding:16px;margin-bottom:24px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#B0A070;margin-bottom:4px;">Quick win</div>
        <div style="font-size:14px;color:#4A4A52;line-height:1.5;">${escapeHtml(quickWin)}</div>
      </div>
      ` : ''}

      <!-- Next steps -->
      <div style="border-top:1px solid rgba(0,0,0,0.06);padding-top:20px;">
        <h2 style="font-size:16px;font-weight:700;color:#1A1A1C;margin:0 0 8px;">What happens next</h2>
        <p style="font-size:14px;color:#4A4A52;line-height:1.6;margin:0 0 16px;">We'll review your results and be in touch within 24 hours with a personalised recommendation for ${companyName}.</p>
        <a href="https://pely.ai/#contact" style="display:inline-block;background:linear-gradient(135deg,#D0BC8A,#B0A070);color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:10px;">Book a call</a>
      </div>

    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:32px;">
      <p style="font-size:12px;color:#7A7A84;margin:0;">Pely.ai — workflow automation, Manchester</p>
      <p style="font-size:12px;color:#7A7A84;margin:4px 0 0;"><a href="https://pely.ai" style="color:#B0A070;text-decoration:none;">pely.ai</a></p>
    </div>

  </div>
</body>
</html>`.trim();

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Pely.ai <hello@pely.ai>',
        to: [to],
        reply_to: 'info@pely.ai',
        subject: 'Your discovery results',
        html: html
      })
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      console.error('Resend API error:', response.status, errBody);
      return res.status(502).json({ error: 'Email delivery failed', detail: errBody });
    }

    const result = await response.json();
    return res.status(200).json({ success: true, id: result.id });

  } catch (err) {
    console.error('Send summary error:', err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

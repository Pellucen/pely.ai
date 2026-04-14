export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const { to, subject, fields } = req.body || {};

  if (!to || typeof to !== 'string' || !to.includes('@')) {
    return res.status(400).json({ error: 'Valid recipient email required' });
  }
  if (!subject || typeof subject !== 'string') {
    return res.status(400).json({ error: 'Subject required' });
  }
  if (!fields || typeof fields !== 'object') {
    return res.status(400).json({ error: 'Fields object required' });
  }

  // Build HTML table rows from fields
  const rows = Object.entries(fields)
    .map(([key, value]) => {
      const val = String(value || 'Not provided');
      // Handle multiline values (e.g. steps detail)
      const formatted = escapeHtml(val).replace(/\n/g, '<br>');
      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-weight:600;color:#1A1A1C;white-space:nowrap;vertical-align:top;width:1%;">${escapeHtml(key)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;color:#4A4A52;">${formatted}</td>
      </tr>`;
    })
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F6F2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:32px 16px;">

    <div style="text-align:center;margin-bottom:24px;">
      <img src="https://pellucen.co.uk/pellucen-logo-email.png" alt="Pellucen" width="40" height="40" style="display:block;margin:0 auto 8px;">
      <div style="font-size:13px;font-weight:600;color:#1A1A1C;letter-spacing:0.5px;">Pellucen AI</div>
    </div>

    <div style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid rgba(0,0,0,0.06);">
      <div style="background:linear-gradient(135deg,#D0BC8A,#B0A070);padding:16px 20px;">
        <div style="font-size:16px;font-weight:700;color:#ffffff;">${escapeHtml(subject)}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.5;">
        ${rows}
      </table>
    </div>

    <div style="text-align:center;margin-top:24px;">
      <p style="font-size:11px;color:#7A7A84;margin:0;">Pellucen AI internal — do not forward</p>
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
        from: 'Pellucen AI <notifications@pellucen.co.uk>',
        to: [to],
        subject: subject,
        html: html
      })
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      console.error('Resend API error:', response.status, errBody);
      return res.status(502).json({ error: 'Email delivery failed' });
    }

    const result = await response.json();
    return res.status(200).json({ success: true, id: result.id });

  } catch (err) {
    console.error('Send email error:', err.message);
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

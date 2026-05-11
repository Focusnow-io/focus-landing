export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, company, role, email, phone, headcount } = req.body ?? {};

  if (!name || !company || !role || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const escape = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;color:#1E1E1E;max-width:560px;margin:0 auto;padding:32px 24px;">
  <div style="margin-bottom:24px;">
    <svg width="28" height="28" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M250 30C120 30 30 130 30 250C30 370 120 470 250 470C380 470 470 370 470 250C470 190 445 140 410 105L350 170C370 195 385 225 385 250C385 330 330 385 250 385C170 385 115 330 115 250C115 170 170 115 250 115C270 115 290 120 305 130L355 65C325 45 290 30 250 30Z" fill="#F04A00"/>
      <circle cx="250" cy="250" r="75" fill="#000"/>
      <path d="M310 170C340 195 355 225 355 260L470 250C470 190 445 140 410 105Z" fill="#F04A00"/>
    </svg>
  </div>

  <h2 style="font-size:20px;font-weight:700;margin:0 0 4px;">New pilot call request</h2>
  <p style="color:#9A9A9A;font-size:13px;margin:0 0 28px;">Submitted via focusnow.io</p>

  <table style="width:100%;border-collapse:collapse;">
    <tr style="border-bottom:1px solid #E6E6E3;">
      <td style="padding:12px 0;font-size:12px;color:#9A9A9A;width:140px;text-transform:uppercase;letter-spacing:0.06em;">Name</td>
      <td style="padding:12px 0;font-size:14px;font-weight:600;">${escape(name)}</td>
    </tr>
    <tr style="border-bottom:1px solid #E6E6E3;">
      <td style="padding:12px 0;font-size:12px;color:#9A9A9A;text-transform:uppercase;letter-spacing:0.06em;">Company</td>
      <td style="padding:12px 0;font-size:14px;font-weight:600;">${escape(company)}</td>
    </tr>
    <tr style="border-bottom:1px solid #E6E6E3;">
      <td style="padding:12px 0;font-size:12px;color:#9A9A9A;text-transform:uppercase;letter-spacing:0.06em;">Role</td>
      <td style="padding:12px 0;font-size:14px;">${escape(role)}</td>
    </tr>
    <tr style="border-bottom:1px solid #E6E6E3;">
      <td style="padding:12px 0;font-size:12px;color:#9A9A9A;text-transform:uppercase;letter-spacing:0.06em;">Email</td>
      <td style="padding:12px 0;font-size:14px;"><a href="mailto:${escape(email)}" style="color:#F05A00;">${escape(email)}</a></td>
    </tr>
    <tr style="border-bottom:1px solid #E6E6E3;">
      <td style="padding:12px 0;font-size:12px;color:#9A9A9A;text-transform:uppercase;letter-spacing:0.06em;">Phone</td>
      <td style="padding:12px 0;font-size:14px;">${escape(phone) || '<span style="color:#C0C0C0;">Not provided</span>'}</td>
    </tr>
    <tr>
      <td style="padding:12px 0;font-size:12px;color:#9A9A9A;text-transform:uppercase;letter-spacing:0.06em;">Headcount</td>
      <td style="padding:12px 0;font-size:14px;">${escape(headcount) || '<span style="color:#C0C0C0;">Not specified</span>'}</td>
    </tr>
  </table>

  <div style="margin-top:32px;padding:16px;background:#FFF3EC;border-radius:8px;">
    <a href="mailto:${escape(email)}" style="display:inline-block;background:#F05A00;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:13px;font-weight:600;">Reply to ${escape(name)} →</a>
  </div>
</body>
</html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Focus <demo@focusnow.io>',
        to: ['shahar@focusnow.io', 'nir@focusnow.io'],
        reply_to: `${name} <${email}>`,
        subject: `Pilot call request — ${company}`,
        html,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Resend error:', err);
      return res.status(500).json({ error: 'Email send failed' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

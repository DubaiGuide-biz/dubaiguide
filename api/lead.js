export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { vertical, answers, recommendation, contact } = req.body;

    const emailBody = `
New lead from mydubaiguide.biz

Vertical: ${vertical}
Name: ${contact.name}
Email: ${contact.email}
Phone: ${contact.phone}

Answers:
${Object.entries(answers).map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n')}

AI Recommendation:
${recommendation}
    `.trim();

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.RESEND_API_KEY
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: 'tejas09999@gmail.com',
        subject: 'New ' + vertical + ' lead — ' + contact.name,
        text: emailBody
      })
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
}

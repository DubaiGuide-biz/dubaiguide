export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { vertical, answers, recommendation, contact } = req.body;
    const isEmailOnly = contact.name === 'Email capture only';

    // ── Email TO YOU (always) ──────────────────────────────────────
    const adminBody = `
New ${isEmailOnly ? 'email capture' : 'lead'} from mydubaiguide.biz

Type: ${isEmailOnly ? 'Email only (no phone)' : 'Full lead'}
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
        from: 'leads@mydubaiguide.biz',
        to: 'tejas09999@gmail.com',
        subject: isEmailOnly
          ? `New email capture (${vertical}) — ${contact.email}`
          : `New ${vertical} lead — ${contact.name}`,
        text: adminBody
      })
    });

    // ── Email TO USER (only for email capture) ────────────────────
    if (isEmailOnly) {
      const verticalLabel = vertical === 'property' ? 'property' : 'business setup';
      const userBody = `
Hi there,

Here's your Dubai ${verticalLabel} match from mydubaiguide.biz:

${recommendation}

${vertical === 'property' ? `Your answers:
- Budget: ${answers.budget || 'Not specified'}
- Purpose: ${answers.purpose || 'Not specified'}
- Type: ${answers.type || 'Not specified'}
- Area preference: ${Array.isArray(answers.area) ? answers.area.join(', ') : (answers.area || 'Not specified')}
- Priority: ${answers.priority || 'Not specified'}` : `Your answers:
- Business type: ${answers.industry || 'Not specified'}
- Visas needed: ${answers.visas || 'Not specified'}
- Setup budget: ${answers.budget || 'Not specified'}
- Priority: ${answers.priority || 'Not specified'}`}

Want to go further? Visit mydubaiguide.biz and request a specialist introduction — we'll connect you with the right person for your situation.

mydubaiguide.biz
      `.trim();

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + process.env.RESEND_API_KEY
        },
        body: JSON.stringify({
          from: 'match@mydubaiguide.biz',
          to: contact.email,
          subject: `Your Dubai ${verticalLabel} match`,
          text: userBody
        })
      });
    }

    res.status(200).json({ ok: true });

  } catch (err) {
    console.log('LEAD ERROR:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
}

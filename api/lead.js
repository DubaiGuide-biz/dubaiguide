export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const lead = req.body;
    console.log('NEW LEAD:', JSON.stringify(lead));
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
}

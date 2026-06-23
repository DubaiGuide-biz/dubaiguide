export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { vertical, answers } = req.body;
    
    const keyPreview = (process.env.ANTHROPIC_API_KEY || 'NOT FOUND').slice(0, 12);
    res.status(200).json({ recommendation: 'Key preview: ' + keyPreview });
    return;
    
    const prompt = 'Give a 2-sentence Dubai property recommendation for someone with budget: ' + JSON.stringify(answers);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const textBlock = (data.content || []).find((b) => b.type === 'text');
    const errorMsg = data.error ? data.error.message : null;

    res.status(200).json({
      recommendation: textBlock
        ? textBlock.text
        : ('Debug: ' + (errorMsg || JSON.stringify(data)))
    });
  } catch (err) {
    res.status(200).json({ recommendation: 'Fetch error: ' + err.message });
  }
}

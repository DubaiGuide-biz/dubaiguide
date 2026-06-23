export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { vertical, answers } = req.body;

    const prompt = 'Vertical: ' + vertical + '\nAnswers: ' + JSON.stringify(answers) +
      '\n\nGive a specific, concise Dubai ' + (vertical === 'property' ? 'property buying' : 'business setup') +
      ' recommendation based on these answers. 3-4 sentences, plain language, mention 1-2 real concrete ' +
      (vertical === 'property' ? 'community or area names' : 'free zone names') +
      ' where relevant. No bullet points, no preamble, do not mention that you are an AI.';

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
        : ('Error: ' + (errorMsg || JSON.stringify(data)))
    });
  } catch (err) {
    res.status(200).json({ recommendation: 'Fetch error: ' + err.message });
  }
}

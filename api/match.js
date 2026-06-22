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
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    console.log('ANTHROPIC RESPONSE:', JSON.stringify(data));
    const textBlock = (data.content || []).find((b) => b.type === 'text');
    res.status(200).json({
      recommendation: textBlock ? textBlock.text : 'Could not generate a match right now — try again.'
    });
  } catch (err) {
    console.log('ANTHROPIC ERROR:', err.message);
    res.status(500).json({ recommendation: 'Could not reach the matching engine right now — try again in a moment.' });
  }
}

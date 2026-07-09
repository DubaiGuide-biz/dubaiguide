export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { vertical, answers } = req.body;

    const prompt = vertical === 'property'
      ? `You are a Dubai property expert. Based on these answers: ${JSON.stringify(answers)}
         
         Give a sharp, specific 2-3 sentence recommendation. Name 1-2 specific communities. Be direct and confident, no waffle. Don't start with "Based on your answers". Don't use bullet points. Sound like an expert friend giving honest advice, not a sales pitch. End with one specific reason why now is a good time to act in that area.`
      : `You are a Dubai business setup expert. Based on these answers: ${JSON.stringify(answers)}
         
         Give a sharp, specific 2-3 sentence recommendation. Name the specific free zone or mainland route. Be direct and confident, no waffle. Don't start with "Based on your answers". Don't use bullet points. Sound like an expert friend giving honest advice. Include one specific cost figure.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const textBlock = (data.content || []).find((b) => b.type === 'text');
    const rawText = textBlock ? textBlock.text : null;
    const cleanText = rawText ? rawText.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1') : null;
    const errorMsg = data.error ? data.error.message : null;

    // Build Bayut search URL for property vertical
    let bayutUrl = null;
    if (vertical === 'property' && answers.budget) {
      const budgetMap = {
        'Under AED 1M': { min: 0, max: 1000000 },
        'AED 1–2M': { min: 1000000, max: 2000000 },
        'AED 2–5M': { min: 2000000, max: 5000000 },
        'AED 5M+': { min: 5000000, max: 20000000 }
      };
      const typeMap = {
        'Apartment': 'apartment',
        'Villa or townhouse': 'villa',
        'Either': ''
      };
      const budget = budgetMap[answers.budget] || { min: 0, max: 5000000 };
      const type = typeMap[answers.type] || '';
      const purpose = answers.purpose === 'Living in it' ? 'sale' : 'sale';
      
      let bayutBase = `https://www.bayut.com/buy/property-for-sale/dubai/`;
      if (type) bayutBase = `https://www.bayut.com/buy/${type}-for-sale/dubai/`;
      bayutUrl = `${bayutBase}?price_min=${budget.min}&price_max=${budget.max}`;
    }

    res.status(200).json({
      recommendation: cleanText || ('Error: ' + (errorMsg || JSON.stringify(data))),
      bayutUrl,
      vertical
    });

  } catch (err) {
    res.status(200).json({ 
      recommendation: 'Fetch error: ' + err.message,
      bayutUrl: null,
      vertical
    });
  }
}

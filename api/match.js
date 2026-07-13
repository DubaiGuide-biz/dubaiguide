export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { vertical, answers } = req.body;

    const today = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    const areaSlugMap = {
      'Downtown Dubai':        { listing: 'downtown-dubai',        transactions: 'downtown-dubai' },
      'Business Bay':          { listing: 'business-bay',          transactions: 'business-bay' },
      'Dubai Marina':          { listing: 'dubai-marina',          transactions: 'dubai-marina' },
      'JBR':                   { listing: 'jumeirah-beach-residence-jbr', transactions: 'jumeirah-beach-residence-jbr' },
      'Dubai Hills Estate':    { listing: 'dubai-hills-estate',    transactions: 'dubai-hills-estate' },
      'Arabian Ranches':       { listing: 'arabian-ranches',       transactions: 'arabian-ranches' },
      'JVC':                   { listing: 'jumeirah-village-circle', transactions: 'jumeirah-village-circle' },
      'Dubai South':           { listing: 'dubai-south',           transactions: 'dubai-south' },
      'Dubailand':             { listing: 'dubailand',             transactions: 'dubailand' },
      'Jebel Ali':             { listing: 'jebel-ali',             transactions: 'jebel-ali' },
      'Al Furjan':             { listing: 'al-furjan',             transactions: 'al-furjan' },
      'Town Square':           { listing: 'town-square',           transactions: 'town-square' },
      'Mudon':                 { listing: 'mudon',                 transactions: 'mudon' },
      'Dubai Creek Harbour':   { listing: 'dubai-creek-harbour',   transactions: 'dubai-creek-harbour' },
    };

    const budgetMap = {
      'Under AED 1M':  { min: 0,       max: 1000000  },
      'AED 1–2M':      { min: 1000000,  max: 2000000  },
      'AED 2–5M':      { min: 2000000,  max: 5000000  },
      'AED 5M+':       { min: 5000000,  max: 30000000 }
    };

    const typeSlugMap = {
      'Apartment':          'apartments',
      'Villa or townhouse': 'villas',
      'Either':             'property'
    };

    const freeZoneMap = {
      'Consultancy or services': ['IFZA', 'Meydan'],
      'Trading':                 ['IFZA', 'Dubai South Free Zone'],
      'E-commerce':              ['Dubai CommerCity', 'IFZA'],
      'Restaurant or F&B':       ['Dubai Mainland (DET)', 'Dubai Airport Free Zone'],
      'Tech or startup':         ['Dubai Internet City', 'IFZA']
    };

    let prompt;

    if (vertical === 'property') {
      const areaOptions = Object.keys(areaSlugMap).join(', ');
      prompt = `You are a Dubai property expert. Today is ${today}. A buyer completed a quiz: ${JSON.stringify(answers)}.

Respond ONLY with a JSON object, no other text, no markdown, no backticks:
{
  "recommendation": "2 sentences max. Direct, specific, expert advice. Reference H2 2026 market conditions. No filler.",
  "area": "Pick ONE area from this exact list that best matches their answers: ${areaOptions}"
}`;
    } else {
      prompt = `You are a Dubai business setup expert. Today is ${today}. Someone completed a quiz: ${JSON.stringify(answers)}.

Respond ONLY with a JSON object, no other text, no markdown, no backticks:
{
  "recommendation": "2 sentences max. Name the specific free zone or mainland route. Include one real 2026 cost figure. No filler."
}`;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const textBlock = (data.content || []).find((b) => b.type === 'text');
    const rawText = textBlock ? textBlock.text.trim() : '{}';

    let parsed = {};
    try {
      const clean = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(clean);
    } catch (e) {
      parsed = { recommendation: rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').trim() };
    }
    const recommendation = parsed.recommendation || 'Could not generate a match right now.';

    let bayutListingsUrl = null;
    let bayutInsightsUrl = null;

    if (vertical === 'property') {
      const budget = budgetMap[answers.budget] || { min: 0, max: 5000000 };
      const typeSlug = typeSlugMap[answers.type] || 'property';
      

      const aiArea = parsed.area || null;
      const slugs = aiArea ? areaSlugMap[aiArea] : null;
      const areaPath = slugs ? `${slugs.listing}/` : '';
      const transactionsPath = slugs ? `${slugs.transactions}/` : '';

      bayutListingsUrl = `https://www.bayut.com/for-sale/${typeSlug}/dubai/${areaPath}?price_min=${budget.min}&price_max=${budget.max}`;
      bayutInsightsUrl = `https://www.bayut.com/property-market-analysis/transactions/sale/property/dubai/${transactionsPath}`;
    }

    res.status(200).json({
      recommendation,
      bayutListingsUrl,
      bayutInsightsUrl,
      vertical
    });

  } catch (err) {
    res.status(200).json({
      recommendation: 'Fetch error: ' + err.message,
      bayutListingsUrl: null,
      bayutInsightsUrl: null,
      vertical
    });
  }
}

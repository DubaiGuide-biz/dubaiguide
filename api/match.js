export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { vertical, answers } = req.body;

    const today = new Date().toLocaleDateString('en-GB', {
      month: 'long', year: 'numeric'
    });

    const prompt = vertical === 'property'
      ? `You are a Dubai property expert. Today is ${today}. A user has answered a property matching quiz with these answers: ${JSON.stringify(answers)}

Write a complete, standalone 2-3 sentence property recommendation. Rules:
- Start directly with the recommendation (e.g. "For a AED 1-2M investment budget...")
- Name 1-2 specific Dubai communities
- Reference current H2 2026 market conditions (cooling in some areas, selective buyers, good negotiating room)
- End with one concrete reason this makes sense right now
- No bullet points, no asterisks, no markdown, no incomplete sentences`
      : `You are a Dubai business setup expert. Today is ${today}. A user has answered a business setup quiz with these answers: ${JSON.stringify(answers)}

Write a complete, standalone 2-3 sentence business setup recommendation. Rules:
- Start directly with the recommendation
- Name the specific free zone or mainland route
- Include one real 2026 cost figure (e.g. "all-in around AED 22,000 for year one")
- No bullet points, no asterisks, no markdown, no incomplete sentences`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 250,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const textBlock = (data.content || []).find((b) => b.type === 'text');
    const rawText = textBlock ? textBlock.text : null;
    const cleanText = rawText
      ? rawText.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').trim()
      : null;

    let bayutListingsUrl = null;
    let bayutInsightsUrl = null;

    if (vertical === 'property') {
      const budgetMap = {
        'Under AED 1M':  { min: 0,       max: 1000000  },
        'AED 1–2M':      { min: 1000000,  max: 2000000  },
        'AED 2–5M':      { min: 2000000,  max: 5000000  },
        'AED 5M+':       { min: 5000000,  max: 30000000 }
      };
      const typeMap = {
        'Apartment':          'apartment',
        'Villa or townhouse': 'villa',
        'Either':             'property'
      };
      const areaSlugMap = {
        'Downtown or Business Bay':       'downtown-dubai',
        'Dubai Marina or JBR':            'dubai-marina',
        'Dubai Hills or Arabian Ranches': 'dubai-hills-estate',
        'JVC or Dubai South':             'jumeirah-village-circle-jvc',
        'Dubailand':                      'dubailand',
        'Jebel Ali':                      'jebel-ali',
        'Al Furjan':                      'al-furjan',
        'No preference':                  null
      };
      const insightsSlugMap = {
        'Downtown or Business Bay':       'downtown-dubai',
        'Dubai Marina or JBR':            'dubai-marina',
        'Dubai Hills or Arabian Ranches': 'dubai-hills-estate',
        'JVC or Dubai South':             'jumeirah-village-circle',
        'Dubailand':                      'dubailand',
        'Jebel Ali':                      'jebel-ali',
        'Al Furjan':                      'al-furjan',
        'No preference':                  null
      };

      const budget = budgetMap[answers.budget] || { min: 0, max: 5000000 };
      const type = typeMap[answers.type] || 'property';

      const selectedAreas = Array.isArray(answers.area) ? answers.area : (answers.area ? [answers.area] : []);
      const firstArea = selectedAreas.find(a => a !== 'No preference');
      const areaSlug = firstArea ? areaSlugMap[firstArea] : null;
      const insightsSlug = firstArea ? insightsSlugMap[firstArea] : null;

      const areaPath = areaSlug ? `${areaSlug}/` : '';
      bayutListingsUrl = `https://www.bayut.com/buy/${type}-for-sale/${areaPath}?price_min=${budget.min}&price_max=${budget.max}&sort=date_desc`;

      const insightsArea = insightsSlug || 'dubai';
      bayutInsightsUrl = `https://www.bayut.com/property-trends/dubai/${insightsArea}/`;
    }

    res.status(200).json({
      recommendation: cleanText || ('Error: ' + JSON.stringify(data.error || data)),
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

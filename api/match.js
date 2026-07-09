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
      ? `You are a Dubai property expert. Today is ${today}. Based on these answers: ${JSON.stringify(answers)}
Give a sharp, specific 2-3 sentence recommendation. Name 1-2 specific communities. Be direct and confident. Don't start with "Based on your answers". No bullet points. Sound like an expert friend giving honest advice. End with one specific reason why this area makes sense right now — reference current market conditions in ${today}, not future projections.`
      : `You are a Dubai business setup expert. Today is ${today}. Based on these answers: ${JSON.stringify(answers)}
Give a sharp, specific 2-3 sentence recommendation. Name the specific free zone or mainland route. Be direct and confident. Don't start with "Based on your answers". No bullet points. Sound like an expert friend. Include one specific cost figure accurate for ${today}.`;

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
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    const data = await response.json();

    // Extract final text from potentially multi-turn response
    let cleanText = null;
    if (data.content && Array.isArray(data.content)) {
      const textBlock = data.content.filter(b => b.type === 'text').pop();
      if (textBlock) {
        cleanText = textBlock.text
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .trim();
      }
    }

    // Build links for property vertical
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

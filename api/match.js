export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { vertical, answers } = req.body;

    const today = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    const areaSlugMap = {
      'Downtown Dubai':        { listing: 'downtown-dubai',                   transactions: 'downtown-dubai' },
      'Business Bay':          { listing: 'business-bay',                     transactions: 'business-bay' },
      'Dubai Marina':          { listing: 'dubai-marina',                     transactions: 'dubai-marina' },
      'JBR':                   { listing: 'jumeirah-beach-residence-jbr',     transactions: 'jumeirah-beach-residence-jbr' },
      'Dubai Hills Estate':    { listing: 'dubai-hills-estate',               transactions: 'dubai-hills-estate' },
      'Arabian Ranches':       { listing: 'arabian-ranches',                  transactions: 'arabian-ranches' },
      'JVC':                   { listing: 'jumeirah-village-circle',          transactions: 'jumeirah-village-circle' },
      'Dubai South':           { listing: 'dubai-south',                      transactions: 'dubai-south' },
      'Dubailand':             { listing: 'dubailand',                        transactions: 'dubailand' },
      'Jebel Ali':             { listing: 'jebel-ali',                        transactions: 'jebel-ali' },
      'Al Furjan':             { listing: 'al-furjan',                        transactions: 'al-furjan' },
      'Town Square':           { listing: 'town-square',                      transactions: 'town-square' },
      'Mudon':                 { listing: 'mudon',                            transactions: 'mudon' },
      'Dubai Creek Harbour':   { listing: 'dubai-creek-harbour',              transactions: 'dubai-creek-harbour' },
    };

    const budgetMap = {
      'Under AED 1M':  { min: 0,        max: 1000000  },
      'AED 1–2M':      { min: 1000000,  max: 2000000  },
      'AED 2–5M':      { min: 2000000,  max: 5000000  },
      'AED 5M+':       { min: 5000000,  max: 30000000 }
    };

    const typeSlugMap = {
      'Apartment':          'apartments',
      'Villa or townhouse': 'villas',
      'Either':             'property'
    };

    const areaOptions = Object.keys(areaSlugMap).join(', ');

    let prompt;

    if (vertical === 'property') {
      prompt = `You are a Dubai property expert. Today is ${today}. A buyer completed a quiz: ${JSON.stringify(answers)}.

Current Dubai market reality — use this to validate their answers before responding:
- Villas/townhouses minimum realistic budget: AED 1.8M (cheapest in JVC, Town Square, Dubai South). Under AED 1M — zero villas exist.
- Villas AED 1–2M: very limited — Town Square 3-bed townhouse only realistic option, or JVC 2-bed townhouse.
- Villas AED 2–5M: Dubai Hills Estate, Arabian Ranches, Dubailand, Al Furjan, Mudon, Town Square.
- Villas AED 5M+: Palm Jumeirah, Emirates Hills, Arabian Ranches 2, Dubai Hills Estate premium.
- Apartments under AED 1M: JVC, Dubai South, Dubailand, International City only.
- Apartments AED 1–2M: JVC, Dubai South, Al Furjan, Business Bay, Dubai Marina possible.
- Apartments AED 2–5M: Dubai Marina, Downtown Dubai, Business Bay, Dubai Hills Estate, Palm Jumeirah.
- Business Bay, Downtown Dubai, Dubai Marina — apartments ONLY, no villas.
- Off-plan: typically 10–20% cheaper than ready but requires 2–4 year wait.

Validation rules:
1. If their budget cannot buy their chosen property type anywhere in Dubai, say so directly, give the realistic minimum needed, and suggest the closest alternative that fits their budget.
2. If their selected area has no properties matching their type (e.g. villas in Business Bay), say so and suggest 2 areas that do match.
3. If budget and type are realistic, give a sharp 2-sentence recommendation referencing H2 2026 market conditions.
4. Never invent properties that do not exist. Be honest even if the answer is that their budget needs to increase.

Respond ONLY with a valid JSON object. No backticks, no markdown, no explanation outside the JSON:
{
  "recommendation": "2 sentences max. Direct and honest. If mismatch — say what the real minimum budget is and suggest alternatives. If realistic — give sharp H2 2026 market advice.",
  "area": "Pick the single best matching area from this exact list: ${areaOptions}"
}`;

    } else {
      prompt = `You are a Dubai business setup expert. Today is ${today}. Someone completed a quiz: ${JSON.stringify(answers)}.

Respond ONLY with a valid JSON object. No backticks, no markdown, no explanation outside the JSON:
{
  "recommendation": "2 sentences max. Name the specific free zone or mainland route. Include one real ${today} cost figure. Direct and honest."
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
      parsed = {
        recommendation: rawText
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .trim()
      };
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

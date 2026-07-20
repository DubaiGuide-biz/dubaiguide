export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { vertical, answers } = req.body;

    const today = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    // ── PROPERTY MAPS ──────────────────────────────────────────────
    const areaSlugMap = {
      'Downtown Dubai':      { listing: 'downtown-dubai',              tx: 'downtown-dubai' },
      'Business Bay':        { listing: 'business-bay',                tx: 'business-bay' },
      'Dubai Marina':        { listing: 'dubai-marina',                tx: 'dubai-marina' },
      'JBR':                 { listing: 'jumeirah-beach-residence-jbr', tx: 'jumeirah-beach-residence-jbr' },
      'Dubai Hills Estate':  { listing: 'dubai-hills-estate',          tx: 'dubai-hills-estate' },
      'Arabian Ranches':     { listing: 'arabian-ranches',             tx: 'arabian-ranches' },
      'JVC':                 { listing: 'jumeirah-village-circle',     tx: 'jumeirah-village-circle' },
      'Dubai South':         { listing: 'dubai-south',                 tx: 'dubai-south' },
      'Dubailand':           { listing: 'dubailand',                   tx: 'dubailand' },
      'Jebel Ali':           { listing: 'jebel-ali',                   tx: 'jebel-ali' },
      'Al Furjan':           { listing: 'al-furjan',                   tx: 'al-furjan' },
      'Town Square':         { listing: 'town-square',                 tx: 'town-square' },
      'Mudon':               { listing: 'mudon',                       tx: 'mudon' },
      'Dubai Creek Harbour': { listing: 'dubai-creek-harbour',         tx: 'dubai-creek-harbour' },
    };

    const budgetMap = {
      'Under AED 1M': { min: 0,       max: 1000000  },
      'AED 1–2M':     { min: 1000000, max: 2000000  },
      'AED 2–5M':     { min: 2000000, max: 5000000  },
      'AED 5M+':      { min: 5000000, max: 30000000 }
    };

    const typeSlugMap = {
      'Apartment':          'apartments',
      'Villa or townhouse': 'villas',
      'Either':             'property'
    };

    // ── BUSINESS MAPS ──────────────────────────────────────────────
    businessLinks = {
  apply: fz ? { label: `Apply for ${fz.name} license →`, url: fz.url } : null,
  nameCheck: { label: 'Check company name availability →', url: 'https://ded.ae/service_details/en/name_reservation' },
  ftaRegister: { label: 'Register for corporate tax (FTA) →', url: 'https://tax.gov.ae/en/services/corporate.tax.registration.aspx' },
  visa: { label: 'Start your visa application (GDRFA) →', url: 'https://gdrfad.gov.ae/en/services' }
};

    const areaOptions = Object.keys(areaSlugMap).join(', ');
    const freeZoneOptions = Object.keys(freeZoneLinkMap).join(', ');

    let prompt;

    if (vertical === 'property') {
      prompt = `You are a Dubai property expert. Today is ${today}. A buyer completed a quiz: ${JSON.stringify(answers)}.

Current Dubai market reality:
- Villas/townhouses minimum realistic budget: AED 1.8M. Under AED 1M — zero villas exist.
- Villas AED 1–2M: very limited — Town Square 3-bed townhouse or JVC 2-bed townhouse only.
- Villas AED 2–5M: Dubai Hills Estate, Arabian Ranches, Dubailand, Al Furjan, Mudon, Town Square.
- Apartments under AED 1M: JVC, Dubai South, Dubailand only.
- Apartments AED 1–2M: JVC, Dubai South, Al Furjan, Business Bay, Dubai Marina.
- Business Bay, Downtown Dubai, Dubai Marina — apartments ONLY, no villas.
- If budget/type mismatch: say so directly and give realistic minimum needed.
- If area has no matching property type: say so and suggest 2 correct areas.

Respond ONLY with valid JSON, no backticks, no markdown:
{
  "recommendation": "2 sentences max. Honest, direct, expert. Reference H2 2026 market conditions.",
  "area": "Pick ONE from: ${areaOptions}"
}`;

    } else {
      prompt = `You are a Dubai business setup expert. Today is ${today}. Someone completed a quiz: ${JSON.stringify(answers)}.

Available free zones and mainland options: ${freeZoneOptions}

Match their answers to the best option. Consider:
- Consultancy/services with low budget → IFZA or Meydan (AED 12,500–13,000)
- Tech startups → Dubai Internet City or Dubai Silicon Oasis
- E-commerce → Dubai CommerCity or IFZA
- Trading → DMCC or RAKEZ
- Restaurant/F&B → Mainland (DET) — must be mainland
- Mainland market access needed → Mainland (DET)
- Lowest cost (okay with non-Dubai address) → SHAMS or RAKEZ
- Multiple shareholders/larger setup → DMCC

Respond ONLY with valid JSON, no backticks, no markdown:
{
  "recommendation": "2 sentences max. Name the specific setup. Include one real ${today} cost figure. Direct and honest.",
  "setup": "Pick ONE from: ${freeZoneOptions}"
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
    const textBlock = (data.content || []).find(b => b.type === 'text');
    const rawText = textBlock ? textBlock.text.trim() : '{}';

    let parsed = {};
    try {
      const clean = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(clean);
    } catch (e) {
      parsed = { recommendation: rawText.replace(/```json?\n?|```\n?|\*\*/g, '').trim() };
    }

    const recommendation = parsed.recommendation || 'Could not generate a match right now.';

    // ── BUILD PROPERTY LINKS ────────────────────────────────────────
    let bayutListingsUrl = null;
    let bayutInsightsUrl = null;

    if (vertical === 'property') {
      const budget = budgetMap[answers.budget] || { min: 0, max: 5000000 };
      const typeSlug = typeSlugMap[answers.type] || 'property';
      const aiArea = parsed.area || null;
      const slugs = aiArea ? areaSlugMap[aiArea] : null;
      const areaPath = slugs ? `${slugs.listing}/` : '';
      const txPath = slugs ? `${slugs.tx}/` : '';
      bayutListingsUrl = `https://www.bayut.com/for-sale/${typeSlug}/dubai/${areaPath}?price_min=${budget.min}&price_max=${budget.max}`;
      bayutInsightsUrl = `https://www.bayut.com/property-market-analysis/transactions/sale/property/dubai/${txPath}`;
    }

    // ── BUILD BUSINESS LINKS ────────────────────────────────────────
    let businessLinks = null;

    if (vertical === 'business') {
      const setup = parsed.setup || null;
      const fz = setup ? freeZoneLinkMap[setup] : null;

      businessLinks = {
        apply: fz ? { label: `Apply for ${fz.name} license →`, url: fz.url } : null,
        nameCheck: { label: 'Check company name availability →', url: 'https://eservices.economy.gov.ae/nameReservation/index' },
        ftaRegister: { label: 'Register for corporate tax (FTA) →', url: 'https://tax.gov.ae/en/default.aspx' },
        visa: { label: 'Start your visa application →', url: 'https://gdrfad.gov.ae/en/services' }
      };
    }

    res.status(200).json({
      recommendation,
      bayutListingsUrl,
      bayutInsightsUrl,
      businessLinks,
      vertical
    });

  } catch (err) {
    res.status(200).json({
      recommendation: 'Fetch error: ' + err.message,
      bayutListingsUrl: null,
      bayutInsightsUrl: null,
      businessLinks: null,
      vertical
    });
  }
}

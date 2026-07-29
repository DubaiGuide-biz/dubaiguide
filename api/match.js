export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { vertical, answers } = req.body;
    const today = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    const areaSlugMap = {
      'Downtown Dubai':      { listing: 'downtown-dubai',               tx: 'downtown-dubai' },
      'Business Bay':        { listing: 'business-bay',                 tx: 'business-bay' },
      'Dubai Marina':        { listing: 'dubai-marina',                 tx: 'dubai-marina' },
      'JBR':                 { listing: 'jumeirah-beach-residence-jbr', tx: 'jumeirah-beach-residence-jbr' },
      'Dubai Hills Estate':  { listing: 'dubai-hills-estate',           tx: 'dubai-hills-estate' },
      'Arabian Ranches':     { listing: 'arabian-ranches',              tx: 'arabian-ranches' },
      'JVC':                 { listing: 'jumeirah-village-circle',      tx: 'jumeirah-village-circle' },
      'Dubai South':         { listing: 'dubai-south',                  tx: 'dubai-south' },
      'Dubailand':           { listing: 'dubailand',                    tx: 'dubailand' },
      'Jebel Ali':           { listing: 'jebel-ali',                    tx: 'jebel-ali' },
      'Al Furjan':           { listing: 'al-furjan',                    tx: 'al-furjan' },
      'Town Square':         { listing: 'town-square',                  tx: 'town-square' },
      'Mudon':               { listing: 'mudon',                        tx: 'mudon' },
      'Dubai Creek Harbour': { listing: 'dubai-creek-harbour',          tx: 'dubai-creek-harbour' },
    };

    const budgetMap = {
      'Under AED 1M': { min: 0,        max: 1000000  },
      'AED 1-2M':     { min: 1000000,  max: 2000000  },
      'AED 2-5M':     { min: 2000000,  max: 5000000  },
      'AED 5M+':      { min: 5000000,  max: 30000000 }
    };

    const typeSlugMap = {
      'Apartment':          'apartments',
      'Villa or townhouse': 'villas',
      'Either':             'property'
    };

    const freeZoneLinkMap = {
      'IFZA':                    { name: 'IFZA',                  url: 'https://ifza.com/en/set-up-your-business/' },
      'Meydan':                  { name: 'Meydan Free Zone',      url: 'https://www.meydanfz.ae/' },
      'Dubai South':             { name: 'Dubai South Free Zone', url: 'https://www.dubaisouth.ae/en/business/free-zone' },
      'DMCC':                    { name: 'DMCC',                  url: 'https://dmcc.ae/business/set-up-a-new-business' },
      'Dubai Internet City':     { name: 'Dubai Internet City',   url: 'https://www.dubaiinternetcity.com/start-your-business' },
      'Dubai Silicon Oasis':     { name: 'Dubai Silicon Oasis',   url: 'https://www.dsoa.ae/setting-up/' },
      'SHAMS':                   { name: 'SHAMS (Sharjah)',        url: 'https://www.shams.ae/start-a-business/' },
      'RAKEZ':                   { name: 'RAKEZ',                 url: 'https://rakez.com/en/start-a-business' },
      'Ajman Free Zone':         { name: 'Ajman Free Zone',       url: 'https://www.afza.ae/starting-a-business' },
      'Dubai CommerCity':        { name: 'Dubai CommerCity',      url: 'https://www.dubaicommercity.ae/setup' },
      'Dubai Airport Free Zone': { name: 'DAFZA',                 url: 'https://www.dafza.gov.ae/en/setting-up/' },
      'Mainland':                { name: 'Dubai DET (Mainland)',  url: 'https://ded.ae/service_details/en/initial_approval' },
    };

    const bankUrlMap = {
      'Mashreq':            'https://www.mashreqbank.com/en/uae/personal/cards/credit-cards/',
      'Emirates NBD':       'https://www.emiratesnbd.com/en/cards/credit-cards/',
      'ADCB':               'https://www.adcb.com/en/personal/cards/credit-cards/',
      'FAB':                'https://www.bankfab.com/en-ae/personal/cards/credit-cards',
      'HSBC':               'https://www.hsbc.ae/credit-cards/',
      'ADIB':               'https://www.adib.ae/en/personal/cards/credit-cards/',
      'Citibank':           'https://www.citibank.ae/en/personal/credit-cards/',
      'RAKBANK':            'https://rakbank.ae/wps/portal/retail-banking/cards/credit-cards',
      'Emirates Islamic':   'https://www.emiratesislamic.ae/en/personal/cards/credit-cards/',
      'Standard Chartered': 'https://www.sc.com/ae/credit-cards/',
      'CBD':                'https://www.cbd.ae/personal/cards/credit-cards',
      'DIB':                'https://www.dib.ae/personal/cards/credit-cards',
      'Wio':                'https://www.wio.io/personal',
      'Liv':                'https://www.liv.me/en/cards',
      'Amex':               'https://www.americanexpress.com/en-ae/credit-cards/',
    };

    const areaOptions = Object.keys(areaSlugMap).join(', ');
    const freeZoneOptions = Object.keys(freeZoneLinkMap).join(', ');

    let prompt;

    if (vertical === 'property') {
      prompt = `You are a Dubai property expert. Today is ${today}. A buyer completed a quiz: ${JSON.stringify(answers)}.

Current Dubai market reality:
- Villas/townhouses minimum realistic budget: AED 1.8M. Under AED 1M — zero villas exist.
- Villas AED 1-2M: very limited — Town Square 3-bed townhouse or JVC 2-bed townhouse only.
- Villas AED 2-5M: Dubai Hills Estate, Arabian Ranches, Dubailand, Al Furjan, Mudon, Town Square.
- Villas AED 5M+: Palm Jumeirah, Emirates Hills, Arabian Ranches 2, Dubai Hills Estate premium.
- Apartments under AED 1M: JVC, Dubai South, Dubailand only.
- Apartments AED 1-2M: JVC, Dubai South, Al Furjan, Business Bay, Dubai Marina.
- Apartments AED 2-5M: Dubai Marina, Downtown Dubai, Business Bay, Dubai Hills Estate, Palm Jumeirah.
- Business Bay, Downtown Dubai, Dubai Marina — apartments ONLY, no villas.
- If budget/type mismatch: say so directly, give realistic minimum needed, suggest alternative.
- If area has no matching property type: say so and suggest 2 correct areas.

Respond ONLY with valid JSON, no backticks, no markdown:
{
  "recommendation": "2 sentences max. Honest, direct, expert. Reference H2 2026 market conditions.",
  "area": "Pick ONE from: ${areaOptions}"
}`;

    } else if (vertical === 'credit-cards') {
      prompt = `You are a UAE credit card expert. Today is ${today}. Someone completed a quiz: ${JSON.stringify(answers)}.

UAE credit card market by salary tier:

BELOW AED 5K: No unsecured cards. Secured card route only — Mashreq Neo Secured, CBD Secured, NBF Secured. After 6-12 months converts to standard card.

AED 5K-12K (Standard):
- Mashreq Cashback Visa: FREE for life, no salary transfer, 5% dining/international, 2% everywhere. Best all-rounder.
- Wio Credit Card: 2% flat cashback, fully digital, no salary transfer. Best digital card.
- RAKBANK Red: Dining and shopping cashback, AED 5k min, AED 300 fee (waivable).
- Liv Cashback+ (Emirates NBD): 2% cashback, free, AED 5k min.
- ADIB Cashback (Islamic): Free, 1% cashback, AED 5k min. Best Islamic option here.
- Emirates Islamic (Islamic): AED 5k min, Shariah-compliant cashback.
- Emirates NBD Skywards Blue: 0.5 miles/AED 1, AED 5k min. Entry Emirates miles card.
- ADCB SimplyLife: Credit building, AED 5k min.

AED 12K-25K (Mid-premium):
- HSBC Live+: 10% dining cashback, Zomato Gold, AED 12,500 min, FREE year 1 then AED 314. Best dining card in UAE.
- Mashreq Solitaire: Zero FX fees, lounge, AED 15k min, AED 800 fee.
- RAKBANK World Elite: Lounge access, AED 15k min.
- ADCB Traveller: 2x miles, lounge, AED 15k min, AED 700 fee.
- Emirates NBD Skywards Signature: 1.5 miles/AED 1, instant Skywards Silver, unlimited lounge, AED 20k min, AED 900 fee. Best Emirates card at mid-tier.
- Amex Platinum: Unlimited Priority Pass, concierge, hotel benefits, AED 21,250 min, AED 2,300 fee.
- ADIB Gold (Islamic): AED 15k min, Shariah-compliant premium.

AED 25K-40K (Premium):
- Emirates NBD Skywards Infinite: 3.5 miles/USD, Skywards Gold fast-track, AED 4,200 fee, AED 35k min. Best Emirates card.
- ADCB Etihad Guest Infinite: 3 Etihad miles/USD, 60k welcome miles, 4 upgrades, AED 40k min. Best Etihad card.
- FAB Etihad Guest Infinite: 3 Etihad miles/USD, 60k welcome miles, AED 40k min, AED 800 fee.
- Citibank Prestige: Premium travel, concierge, AED 36,750 min.
- FAB Elite: 4% cashback, zero FX fees, lounge, AED 35k min, AED 1,200 fee.

AED 40K-60K (Super premium):
- Citi Ultima: 5 miles/USD international, 2.5 local, 30k bonus miles/year, AED 36,750 min, AED 3,000 fee. Best miles rate in UAE.
- FAB Elite: 20x rewards luxury spend, 50% off 100+ five-star restaurants, AED 50k min, AED 1,200 fee. Best lifestyle card.
- Mashreq Solitaire Black: Zero FX fees, unlimited lounge, concierge, AED 50k min.

AED 60K+ (Elite/VVIP):
- FAB Elite: Best widely available elite card.
- Amex Centurion (Black): Invite-only, needs AED 500k+ annual Amex spend. Dedicated manager, bespoke concierge, airport terminal access. Mention if high spender.
- Private banking cards (ENBD Reserve, FAB Private): Speak to private banking team directly — not applied for publicly.

STRICT RULES:
1. NEVER recommend a card below its salary minimum.
2. Below AED 5k = secured card ONLY, no exceptions.
3. Islamic benefit = ONLY recommend ADIB, Emirates Islamic, DIB, FAB Islamic.
4. Emirates airline = Skywards cards only.
5. Etihad airline = Etihad Guest cards only.
6. Free cards only = Mashreq Cashback, Wio, Liv, ADIB only.
7. Building credit = ADCB SimplyLife or secured route.
8. Name exactly 2 cards. One key benefit each. Honest about fees.
9. Max 3 sentences total.

Respond ONLY with valid JSON, no backticks, no markdown:
{
  "recommendation": "3 sentences max. 2 cards named. Top benefit and fee for each. Honest.",
  "cards": [
    {"name": "Full card name", "bank": "Bank name", "applyUrl": "https://bank-application-url"},
    {"name": "Full card name", "bank": "Bank name", "applyUrl": "https://bank-application-url"}
  ]
}`;

    } else {
      prompt = `You are a Dubai business setup expert. Today is ${today}. Someone completed a quiz: ${JSON.stringify(answers)}.

Available options: ${freeZoneOptions}

Match their answers:
- Consultancy/services low budget: IFZA or Meydan
- Tech startups: Dubai Internet City or Dubai Silicon Oasis
- E-commerce: Dubai CommerCity or IFZA
- Trading: DMCC or RAKEZ
- Restaurant/F&B: Mainland — no exceptions
- Mainland market access: Mainland
- Lowest cost non-Dubai: SHAMS or RAKEZ
- Multiple shareholders: DMCC

Respond ONLY with valid JSON, no backticks, no markdown:
{
  "recommendation": "2 sentences max. Name specific setup. Include one real cost figure. Direct and honest.",
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
        max_tokens: 400,
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

    let businessLinks = null;
    if (vertical === 'business') {
      const setup = parsed.setup || null;
      const fz = setup ? freeZoneLinkMap[setup] : null;
      businessLinks = {
        apply: fz ? { label: `Apply for ${fz.name} license`, url: fz.url } : null,
        nameCheck: { label: 'Check company name availability', url: 'https://ded.ae/service_details/en/name_reservation' },
        ftaRegister: { label: 'Register for corporate tax (FTA)', url: 'https://tax.gov.ae/en/services/corporate.tax.registration.aspx' },
        visa: { label: 'Start your visa application (GDRFA)', url: 'https://gdrfad.gov.ae/en/services' }
      };
    }

    let cardLinks = null;
    if (vertical === 'credit-cards' && parsed.cards && Array.isArray(parsed.cards)) {
      cardLinks = parsed.cards.map(card => ({
        label: `Apply for ${card.name} (${card.bank})`,
        url: card.applyUrl || bankUrlMap[card.bank] || 'https://www.yallacompare.com/credit-cards/'
      }));
    }

    res.status(200).json({
      recommendation,
      bayutListingsUrl,
      bayutInsightsUrl,
      businessLinks,
      cardLinks,
      vertical
    });

  } catch (err) {
    res.status(200).json({
      recommendation: 'Fetch error: ' + err.message,
      bayutListingsUrl: null,
      bayutInsightsUrl: null,
      businessLinks: null,
      cardLinks: null,
      vertical: ''
    });
  }
}

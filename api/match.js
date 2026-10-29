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
- Villas/townhouses minimum realistic budget: AED 1.8M. Under AED 1M zero villas exist.
- Villas AED 1-2M: very limited — Town Square 3-bed townhouse or JVC 2-bed townhouse only.
- Villas AED 2-5M: Dubai Hills Estate, Arabian Ranches, Dubailand, Al Furjan, Mudon, Town Square.
- Villas AED 5M+: Palm Jumeirah, Emirates Hills, Arabian Ranches 2, Dubai Hills Estate premium.
- Apartments under AED 1M: JVC, Dubai South, Dubailand only.
- Apartments AED 1-2M: JVC, Dubai South, Al Furjan, Business Bay, Dubai Marina.
- Apartments AED 2-5M: Dubai Marina, Downtown Dubai, Business Bay, Dubai Hills Estate, Palm Jumeirah.
- Business Bay, Downtown Dubai, Dubai Marina — apartments ONLY, no villas.
- If budget/type mismatch: say so directly, give realistic minimum needed.

Respond ONLY with valid JSON, no backticks, no markdown:
{"recommendation": "2 sentences max. Honest, direct. Reference H2 2026 market.", "area": "Pick ONE from: ${areaOptions}"}`;

    } else if (vertical === 'hotels') {
      prompt = `You are an expert Dubai hotel consultant. Today is ${today}. A visitor completed a hotel matching quiz: ${JSON.stringify(answers)}.

Dubai hotel market knowledge:

BUDGET (under AED 400/night):
- Deira/Bur Dubai: Ibis Dubai Mall of the Emirates, Rove Downtown, Rove City Centre, Premier Inn Dubai Airport, ibis Styles Dubai Airport
- Marina area: Rove Dubai Marina
- Rove brand: best budget brand in Dubai — modern, well-located, young traveller friendly

MID-RANGE (AED 400-900/night):
- Marina/JBR: Marriott Resort Palm Jumeirah, Westin Dubai Marina, Le Meridien Mina Seyahi
- Downtown: Melia Dubai, Sofitel Downtown Dubai, Address Dubai Mall (lower category rooms)
- DIFC/Bay: Taj Dubai, Radisson Blu Hotel Dubai Waterfront
- Good value: Pullman Downtown, Crowne Plaza Festival City

PREMIUM (AED 900-2000/night):
- Marina: Jumeirah Beach Hotel, Intercontinental Dubai Marina, Address Beach Resort
- Downtown: Address Downtown, Vida Downtown, Four Points by Sheraton Downtown
- Palm: Anantara The Palm, Waldorf Astoria Palm Jumeirah, One&Only The Palm
- DIFC: Grosvenor House, Le Royal Meridien Beach Resort

LUXURY (AED 2000+/night):
- Iconic: Burj Al Arab (from AED 6,000), Atlantis The Palm, Atlantis The Royal
- Marina/JBR: Jumeirah Al Naseem, La Mer by Jumeirah, Address Beach Resort (premium floors)
- Downtown: The Lana Dorchester Collection, Armani Hotel Dubai, Sofitel The Obelisk
- Palm: Four Seasons Resort Dubai at Jumeirah Beach, One&Only The Palm, Waldorf Astoria
- Business/DIFC: Four Seasons DIFC, Bvlgari Resort Dubai (Jumeirah Bay Island)

LOCATION MATCHING:
- Dubai Marina / JBR: Marina/waterfront hotels, beach access, walkable to tram and metro
- Downtown Dubai: Address Downtown, Armani, Sofitel, Vida — walking distance to Burj Khalifa and Dubai Mall
- Palm Jumeirah: Atlantis, One&Only, Anantara, Waldorf, Four Seasons Beach — resort feel, quieter
- DIFC / Business Bay: Taj Dubai, Grosvenor House, Four Seasons DIFC, Radisson Blu Waterfront — dining scene, rooftops
- Deira / Old Dubai: ibis, Premier Inn, Rove — budget-friendly, near Creek, authentic Dubai

STYLE MATCHING:
- Full resort: Atlantis The Palm, Jumeirah Al Naseem, Anantara The Palm, Address Beach Resort
- Stylish base: Vida Downtown, Rove (mid-range), Taj Dubai, The Lana
- Business-friendly: Grosvenor House, Taj Dubai, Four Seasons DIFC, Intercontinental Festival City
- Family-focused: Atlantis The Palm (best for families), Jumeirah Beach Hotel, Le Meridien Mina Seyahi
- Boutique & design: Bvlgari Resort, Armani Hotel, The Lana Dorchester, H Hotel Downtown

Rules:
- Recommend exactly 3 hotels in order of best match
- Never recommend a hotel outside the stated budget tier
- Include realistic nightly rate range
- Be specific about what makes each hotel right for this person's answers
- Include 3-4 highlights per hotel (pool, location, kids club, etc.)

Respond ONLY with valid JSON, no backticks, no markdown:
{
  "recommendation": "One sentence summarising the match rationale.",
  "hotels": [
    {
      "name": "Exact hotel name",
      "area": "Area name",
      "priceRange": "AED X,XXX – X,XXX per night",
      "description": "2 sentences on why this hotel is right for this person specifically.",
      "highlights": ["Highlight 1", "Highlight 2", "Highlight 3", "Highlight 4"]
    }
  ]
}`;

    } else if (vertical === 'itinerary') {
      const days = answers.days || '3 days';
      const interests = Array.isArray(answers.interests) ? answers.interests.join(', ') : (answers.interests || 'mix');
      const group = answers.group || 'couple';
      const budget = answers.budget || 'mid-range';
      const dayCount = days === '2 days' ? 2 : days === '3 days' ? 3 : days === '4–5 days' ? 5 : days === '1 week' ? 7 : 14;

      prompt = `You are an expert Dubai travel guide. Today is ${today}. A visitor is planning a trip: ${dayCount} days, interests: ${interests}, travelling as: ${group}, budget: ${budget}.

Build a detailed day-by-day Dubai itinerary with exactly ${dayCount} days.

Rules:
- Name real, specific Dubai venues only
- Morning / afternoon / evening structure for each day
- Match budget: ${budget}
- Match group: ${group}
- Match interests: ${interests}

Venue guidance by interest:
- Culture & history: Al Fahidi Historic District, Dubai Museum, Gold Souk, Spice Souk, Jumeirah Mosque, Etihad Museum, Al Seef
- Beaches & water: JBR Beach, Kite Beach, La Mer, Atlantis Aquaventure, Ain Dubai
- Luxury & fine dining: Nobu at Atlantis, Zuma DIFC, Nusr-Et, Pierchic, Ossiano, Atmosphere Burj Khalifa
- Adventure & outdoor: Skydive Dubai, Desert Safari, Hatta Mountain biking, XLine zipline
- Shopping: Dubai Mall, Mall of the Emirates, Gold Souk, Spice Souk, Outlet Village, Boxpark, City Walk
- Nightlife & bars: White Dubai, Soho Garden, Zero Gravity, FIVE Palm, Iris DIFC
- Family & kids: Dubai Aquarium, IMG Worlds of Adventure, Legoland, Kidzania, Wild Wadi
- Hidden gems & local: Al Quoz galleries, Alserkal Avenue, Satwa neighbourhood, Ripe Market

Budget guidance:
- Budget: Metro, Ravi Restaurant, public beaches, free attractions, street food
- Mid-range: Ubers, casual dining, paid attractions, one nicer restaurant per day
- Premium: taxis, smart casual dining, premium experiences, one luxury dinner
- Luxury: private transfers, fine dining every evening, VIP experiences

Respond ONLY with valid JSON, no backticks:
{
  "intro": "One vivid sentence setting the scene for this specific trip.",
  "days": [{"label": "Day 1", "theme": "Short evocative theme", "plan": "Morning: [specific plan]. Afternoon: [specific plan]. Evening: [specific plan]. Tip: [one practical tip]."}],
  "recommendation": "Full itinerary as plain text fallback"
}`;

    } else if (vertical === 'credit-cards') {
      prompt = `You are a UAE credit card expert. Today is ${today}. Someone completed a quiz: ${JSON.stringify(answers)}.

UAE credit card market by salary tier:

BELOW AED 5K: No unsecured cards. Secured card route only — Mashreq Neo Secured, CBD Secured, NBF Secured.

AED 5K-12K: Mashreq Cashback Visa (FREE for life, 5% dining/international, 2% everywhere), Wio (2% flat, digital, free), RAKBANK Red (dining cashback), Liv Cashback+ (2%, free), ADIB Cashback (Islamic, free), Emirates Islamic (Islamic), Emirates NBD Skywards Blue (0.5 miles/AED).

AED 12K-25K: HSBC Live+ (10% dining, AED 12,500 min, free yr1 then AED 314), Mashreq Solitaire (zero FX, lounge, AED 15k), ADCB Traveller (2x miles, AED 15k), Emirates NBD Skywards Signature (1.5 miles/AED, instant Silver, AED 20k, AED 900 fee), Amex Platinum (unlimited Priority Pass, AED 21,250 min).

AED 25K-40K: Emirates NBD Skywards Infinite (3.5 miles/USD, Gold fast-track, AED 35k, AED 4,200 fee), ADCB Etihad Guest Infinite (3 miles/USD, 60k welcome miles, AED 40k), Citibank Prestige (AED 36,750 min).

AED 40K-60K: Citi Ultima (5 miles/USD, AED 36,750 min, AED 3,000 fee), FAB Elite (20x rewards, 50% off luxury dining, AED 50k).

AED 60K+: FAB Elite (best widely available), Amex Centurion (invite only), Private banking cards.

STRICT RULES: Never recommend card below salary minimum. Below AED 5k = secured only. Islamic = ADIB/Emirates Islamic/DIB only. Emirates flyer = Skywards. Etihad flyer = Etihad Guest. Free only = Mashreq Cashback/Wio/Liv. Name exactly 2 cards. Max 3 sentences.

Respond ONLY with valid JSON, no backticks:
{"recommendation": "3 sentences. 2 cards named. Top benefit and fee each.", "cards": [{"name": "Full card name", "bank": "Bank name", "applyUrl": "https://url"}, {"name": "Full card name", "bank": "Bank name", "applyUrl": "https://url"}]}`;

    } else {
      prompt = `You are a Dubai business setup expert. Today is ${today}. Someone completed a quiz: ${JSON.stringify(answers)}.

Options: ${freeZoneOptions}

Match: Consultancy/low budget=IFZA or Meydan. Tech=Dubai Internet City or Dubai Silicon Oasis. E-commerce=Dubai CommerCity or IFZA. Trading=DMCC or RAKEZ. F&B=Mainland (no exceptions). Mainland access=Mainland. Lowest cost non-Dubai=SHAMS or RAKEZ. Multiple shareholders=DMCC.

Respond ONLY with valid JSON, no backticks:
{"recommendation": "2 sentences. Specific setup. One real cost figure.", "setup": "ONE from: ${freeZoneOptions}"}`;
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
        max_tokens: vertical === 'itinerary' ? 2000 : vertical === 'hotels' ? 1000 : 400,
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
      const slugs = parsed.area ? areaSlugMap[parsed.area] : null;
      const areaPath = slugs ? `${slugs.listing}/` : '';
      const txPath = slugs ? `${slugs.tx}/` : '';
      bayutListingsUrl = `https://www.bayut.com/for-sale/${typeSlug}/dubai/${areaPath}?price_min=${budget.min}&price_max=${budget.max}`;
      bayutInsightsUrl = `https://www.bayut.com/property-market-analysis/transactions/sale/property/dubai/${txPath}`;
    }

    let businessLinks = null;
    if (vertical === 'business') {
      const fz = parsed.setup ? freeZoneLinkMap[parsed.setup] : null;
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

    let itineraryDays = null;
    let itineraryIntro = null;
    if (vertical === 'itinerary' && parsed.days && Array.isArray(parsed.days)) {
      itineraryDays = parsed.days;
      itineraryIntro = parsed.intro || null;
    }

    let hotels = null;
    if (vertical === 'hotels' && parsed.hotels && Array.isArray(parsed.hotels)) {
      hotels = parsed.hotels;
    }

    res.status(200).json({
      recommendation,
      bayutListingsUrl,
      bayutInsightsUrl,
      businessLinks,
      cardLinks,
      itineraryDays,
      itineraryIntro,
      hotels,
      vertical
    });

  } catch (err) {
    res.status(200).json({
      recommendation: 'Fetch error: ' + err.message,
      bayutListingsUrl: null,
      bayutInsightsUrl: null,
      businessLinks: null,
      cardLinks: null,
      itineraryDays: null,
      itineraryIntro: null,
      hotels: null,
      vertical: ''
    });
  }
}

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
      'Under AED 1M': { min: 0, max: 1000000 },
      'AED 1-2M':     { min: 1000000, max: 2000000 },
      'AED 2-5M':     { min: 2000000, max: 5000000 },
      'AED 5M+':      { min: 5000000, max: 30000000 }
    };
    const typeSlugMap = {
      'Apartment': 'apartments',
      'Villa or townhouse': 'villas',
      'Either': 'property'
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
      'Mashreq': 'https://www.mashreqbank.com/en/uae/personal/cards/credit-cards/',
      'Emirates NBD': 'https://www.emiratesnbd.com/en/cards/credit-cards/',
      'ADCB': 'https://www.adcb.com/en/personal/cards/credit-cards/',
      'FAB': 'https://www.bankfab.com/en-ae/personal/cards/credit-cards',
      'HSBC': 'https://www.hsbc.ae/credit-cards/',
      'ADIB': 'https://www.adib.ae/en/personal/cards/credit-cards/',
      'Citibank': 'https://www.citibank.ae/en/personal/credit-cards/',
      'RAKBANK': 'https://rakbank.ae/wps/portal/retail-banking/cards/credit-cards',
      'Emirates Islamic': 'https://www.emiratesislamic.ae/en/personal/cards/credit-cards/',
      'Standard Chartered': 'https://www.sc.com/ae/credit-cards/',
      'CBD': 'https://www.cbd.ae/personal/cards/credit-cards',
      'DIB': 'https://www.dib.ae/personal/cards/credit-cards',
      'Wio': 'https://www.wio.io/personal',
      'Liv': 'https://www.liv.me/en/cards',
      'Amex': 'https://www.americanexpress.com/en-ae/credit-cards/',
    };

    const areaOptions = Object.keys(areaSlugMap).join(', ');
    const freeZoneOptions = Object.keys(freeZoneLinkMap).join(', ');

    let prompt;

    if (vertical === 'property') {
      prompt = `You are a Dubai property expert. Today is ${today}. A buyer completed a quiz: ${JSON.stringify(answers)}.
- Villas under AED 1M: impossible. Villas AED 1-2M: Town Square or JVC only. Villas AED 2-5M: Dubai Hills Estate, Arabian Ranches, Dubailand, Al Furjan, Mudon. Apartments under AED 1M: JVC, Dubai South, Dubailand only. No villas in Business Bay, Downtown, or Marina.
- If mismatch: say so directly, give realistic alternative.
Respond ONLY valid JSON no backticks: {"recommendation":"2 sentences. Honest. H2 2026 market.","area":"ONE from: ${areaOptions}"}`;

    } else if (vertical === 'hotels') {
      prompt = `You are an expert Dubai hotel consultant. Today is ${today}. Visitor quiz: ${JSON.stringify(answers)}.

Dubai hotels by budget:
BUDGET <AED400: Rove Downtown, Rove Dubai Marina, Rove City Centre, ibis Dubai Mall of the Emirates, Premier Inn Dubai Airport, ibis Styles Dubai Airport
MID AED400-900: Westin Dubai Marina, Le Meridien Mina Seyahi, Melia Dubai, Sofitel Downtown Dubai, Taj Dubai, Pullman Downtown, Crowne Plaza Festival City, Marriott Resort Palm Jumeirah
PREMIUM AED900-2000: Address Beach Resort, Intercontinental Dubai Marina, Jumeirah Beach Hotel, Anantara The Palm, Waldorf Astoria Palm Jumeirah, One&Only The Palm, Grosvenor House, Address Downtown
LUXURY AED2000+: Burj Al Arab, Atlantis The Palm, Atlantis The Royal, Four Seasons Dubai JBR, Armani Hotel, The Lana Dorchester, Bvlgari Resort, One&Only The Palm premium, Jumeirah Al Naseem, Four Seasons DIFC

Location: Marina/JBR=beachfront waterfront hotels. Downtown=Address/Armani/Sofitel walkable to Burj Khalifa. Palm=Atlantis/One&Only/Anantara resort feel. DIFC/Bay=Taj/Grosvenor/Four Seasons dining scene. Deira=ibis/Premier Inn/Rove budget authentic.
Style: Resort=Atlantis/Jumeirah Al Naseem/Address Beach. Stylish base=Vida/Taj/The Lana. Business=Grosvenor/Four Seasons DIFC. Family=Atlantis The Palm/Jumeirah Beach Hotel/Le Meridien. Boutique=Bvlgari/Armani/The Lana.

Recommend exactly 3 hotels. Never exceed budget tier. Be specific why each fits their answers.
Respond ONLY valid JSON no backticks:
{"recommendation":"One sentence match rationale.","hotels":[{"name":"Exact name","area":"Area","priceRange":"AED X,XXX-X,XXX/night","description":"2 sentences why right for this person.","highlights":["highlight1","highlight2","highlight3","highlight4"]}]}`;

    } else if (vertical === 'dining') {
      prompt = `You are an expert Dubai food and nightlife guide. Today is ${today}. Visitor quiz: ${JSON.stringify(answers)}.

Dubai dining and nightlife knowledge:

ARABIC & MIDDLE EASTERN:
- Fine dining: Al Hadheerah (Bab Al Shams desert resort), Ewaan (Palace Downtown), Traiteur (Park Hyatt)
- Mid-range: Arabian Tea House (Al Fahidi), Logma (Boxpark/Mall of Emirates), Comptoir 102 (Jumeirah)
- Budget: Al Mallah (Satwa), Ravi Restaurant (Satwa, legendary Pakistani/Indian), Bu Qtair (Jumeirah, seafood shack)
- Hidden gems: Operation Falafel (multiple), Kaftan (JBR), Lowe (Alserkal Avenue)

SOUTH ASIAN (Indian/Pakistani/Bangladeshi/Nepali):
- Fine dining: Rang Mahal by Atul Kochhar (JW Marriott Marquis), Indego by Vineet (Grosvenor House)
- Mid-range: Bombay Bungalow (Hyatt Regency), Zafran (multiple malls), Chor Bizarre (Ramada Downtown)
- Budget/Local: Ravi Restaurant (Satwa, iconic), Dhow Palace (Deira), Al Mandi & Al Madhbi (Deira)
- Hidden gems: Curry Culture (JLT), Dishoom-style spots in Bur Dubai lanes

EAST & SOUTHEAST ASIAN:
- Japanese fine dining: Nobu (Atlantis), Zuma (DIFC), Netsu (Mandarin Oriental)
- Japanese casual: Niri (JBR), Sushi Counter (Jumeirah), Katana (Grosvenor House)
- Chinese: Hakkasan (Jumeirah), China Garden (various), Yauatcha (City Walk)
- Thai: Pai Thai (Al Habtoor), Royal Orchid (multiple), Thiptara (Palace Downtown - floating)
- Korean: Gogi (DIFC), Jungsik (Jumeirah), Palsaik (JBR area)
- Pan-Asian budget: Punjab Grill, various in Dubai Mall Food Court

MEDITERRANEAN & EUROPEAN:
- Fine dining: Pierchic (Jumeirah, over sea), La Petite Maison (DIFC), Il Ristorante Niko Romito (Bulgari)
- Mid-range: Coya (Four Seasons DIFC), Cecconi's (Soho Garden), Eataly (Dubai Mall)
- Casual: Reform Social & Grill (The Lakes), Jones The Grocer (multiple)

AMERICAN & CASUAL:
- Burgers: Salt (Kite Beach, original outdoor), Shake Shack (multiple), Switch (multiple)
- Brunch/casual: The Cheesecake Factory (various), Belgian Cafe (multiple)
- BBQ/steaks: Nusr-Et (multiple), Hunter & Barrel (multiple)

VEGETARIAN/VEGAN:
- Fine: Comptoir 102 (Jumeirah), The Sum of Us (multiple)
- Casual: Wild & the Moon (multiple), Bounty Beets (multiple), Kcal (multiple)
- Indian veg: Govinda's (Bur Dubai, pure veg), Bhavna's (multiple)

ROOFTOP DRINKS & VIEWS:
- Iconic: At.mosphere (Burj Khalifa level 122), Iris (DIFC rooftop), Cé La Vi (Address Sky View)
- Marina views: Q's Bar & Lounge (Le Meridien), Pure Sky Lounge (Hilton Dubai Creek)
- Trendy: Penthouse at Five Palm, Clap (Hilton Dubai Al Habtoor)

FRIDAY BRUNCH (best in Dubai):
- Legendary: Bubbalicious (Westin Dubai Marina), Yalumba (Le Meridien), Al Qasr (Jumeirah)
- Party brunch: Saffron (Atlantis), Warehouse (Le Meridien - value), Fire Lake (Radisson Blu)
- Upscale: Trattoria (Jumeirah Zabeel Saray), Rhodes W1 (Grosvenor House)

BEACH CLUB:
- Premium: Cove Beach (Caesars), Drift Beach (One&Only), Zero Gravity (near airport)
- Popular: Nikki Beach (Pearl Jumeirah), WHITE Beach (Atlantis), Barasti (Le Meridien Mina Seyahi)
- Value: JBR Beach clubs, Sunset Beach (free beach with paid sun loungers)

LATE NIGHT / NIGHTLIFE:
- Clubs: White Dubai (Meydan rooftop - best club), Soho Garden (Meydan), Industrial Avenue (DIFC)
- Bars: Jetty Lounge (One&Only), Sho Cho (Dubai Marine Beach Resort), The Act (Shangri-La)
- Live music: Dubai Opera (check listings), Blue Bar (Novotel), The Fridge (Alserkal)

HIDDEN GEMS (off-the-beaten-path):
- Cafes: Nightjar Coffee (JLT - specialty), Arrows & Sparrows (Al Quoz), % Arabica (various)
- Secret spots: The Gibson (DIFC - speakeasy style), Maiden Shanghai (Westin - hidden bar), Observatory (Dubai Marriott Harbour - little known views)
- Local: Fish market at Deira Fish Market (morning), Satwa street food strip (evening), Al Quoz industrial area cafes
- Unique: Logma (Emirati home cooking), Grapeskin (natural wine bar JLT), Boca (DIFC tapas)

BUDGET GUIDANCE:
- Under AED 80: Ravi, Al Mallah, Satwa street food, Karama food court, Salt burger kiosk, food trucks
- AED 80-200: Most casual dining, Logma, Jones The Grocer, mid-range chain restaurants
- AED 200-500: Most good restaurants, upscale casual, brunches in this range
- AED 500+: Fine dining, premium brunches, rooftop restaurants, Nobu/Zuma level

AREA GUIDANCE:
- Dubai Marina/JBR: Barasti, Zero Gravity, Pier 7, JBR Walk restaurants, beach clubs
- Downtown: At.mosphere, Ewaan, DIFC restaurants nearby, Dubai Mall dining
- Palm Jumeirah: Atlantis restaurants, FIVE Palm, beach clubs, Nobu
- DIFC/Business Bay: La Petite Maison, Coya, Iris, best fine dining concentration, nightlife
- Deira/Old Dubai: Ravi, Al Mallah, Creek seafood, Deira Fish Market, authentic local food

RULES:
- Recommend exactly 3 places
- Hidden gems occasion: avoid popular tourist spots, focus on local secrets
- Match area strictly unless no preference
- Match budget strictly
- Include Google Maps and Zomato links will be auto-generated
- Each must have name, area, price range, 2-sentence description, 2-4 tags, and one insider tip

Respond ONLY valid JSON no backticks:
{"recommendation":"One sentence on why these picks suit this person.","restaurants":[{"name":"Exact venue name","area":"Specific area","priceRange":"AED XX-XX per person","description":"2 sentences why perfect for this person and occasion.","tags":["tag1","tag2","tag3"],"tip":"One insider tip"}]}`;

    } else if (vertical === 'itinerary') {
      const dayCount = answers.days === '2 days' ? 2 : answers.days === '3 days' ? 3 : answers.days === '4–5 days' ? 5 : answers.days === '1 week' ? 7 : 14;
      const interests = Array.isArray(answers.interests) ? answers.interests.join(', ') : (answers.interests || 'mix');
      prompt = `You are an expert Dubai travel guide. Today is ${today}. Trip: ${dayCount} days, interests: ${interests}, group: ${answers.group || 'couple'}, budget: ${answers.budget || 'mid-range'}.
Build exactly ${dayCount} days. Name real specific venues. Morning/Afternoon/Evening structure. Include one Tip per day.
Interests guide: Culture=Al Fahidi/Dubai Museum/Gold Souk/Spice Souk/Jumeirah Mosque. Beach=JBR/Kite Beach/La Mer/Aquaventure. Luxury=Nobu/Zuma/Pierchic/Atmosphere/Burj Al Arab tea. Adventure=Skydive Dubai/Desert Safari/Hatta/XLine. Shopping=Dubai Mall/MOE/Gold Souk/City Walk. Nightlife=White Dubai/Soho Garden/Zero Gravity/FIVE Palm. Family=Aquarium/IMG Worlds/Legoland/Kidzania. Hidden gems=Alserkal Avenue/Satwa/Ripe Market/Al Quoz.
Budget: Under AED 300=metro/Ravi/public beaches/free attractions. AED 300-700=Uber/casual dining/paid attractions. AED 700-1500=taxis/premium dining/VIP. AED 1500+=private transfers/fine dining every night.
Respond ONLY valid JSON no backticks:
{"intro":"One vivid sentence.","days":[{"label":"Day 1","theme":"Short theme","plan":"Morning: [plan]. Afternoon: [plan]. Evening: [plan]. Tip: [tip]."}],"recommendation":"Plain text fallback"}`;

    } else if (vertical === 'credit-cards') {
      prompt = `UAE credit card expert. Today ${today}. Quiz: ${JSON.stringify(answers)}.
BELOW AED5K: Secured only (Mashreq Neo Secured/CBD Secured/NBF Secured).
AED5K-12K: Mashreq Cashback (free,5% dining/intl,2% all), Wio (2% flat,free), RAKBANK Red, Liv Cashback+ (free), ADIB Cashback (Islamic,free), Emirates Islamic (Islamic), ENBD Skywards Blue (0.5miles).
AED12K-25K: HSBC Live+ (10% dining,AED12.5k min,free yr1), Mashreq Solitaire (zero FX,lounge,AED15k), ADCB Traveller (2x miles,AED15k), ENBD Skywards Signature (1.5miles,instant Silver,AED20k,AED900), Amex Platinum (Priority Pass,AED21.25k).
AED25K-40K: ENBD Skywards Infinite (3.5miles/USD,Gold fast-track,AED35k,AED4200), ADCB Etihad Infinite (3miles,60k welcome,AED40k), Citi Prestige (AED36.75k).
AED40K-60K: Citi Ultima (5miles/USD,AED3000 fee), FAB Elite (20x rewards,50% luxury dining,AED50k).
AED60K+: FAB Elite best available. Amex Centurion invite only. Private banking speak to bank.
RULES: Never below minimum. Below AED5k=secured only. Islamic=ADIB/Emirates Islamic/DIB. Emirates=Skywards. Etihad=Etihad Guest. Free only=Mashreq/Wio/Liv. Exactly 2 cards. Max 3 sentences.
Respond ONLY valid JSON: {"recommendation":"3 sentences. 2 cards. Top benefit and fee each.","cards":[{"name":"Full name","bank":"Bank","applyUrl":"https://url"}]}`;

    } else {
      prompt = `Dubai business setup expert. Today ${today}. Quiz: ${JSON.stringify(answers)}.
Options: ${freeZoneOptions}
Consultancy/low budget=IFZA or Meydan. Tech=Dubai Internet City or Dubai Silicon Oasis. E-commerce=Dubai CommerCity or IFZA. Trading=DMCC or RAKEZ. F&B=Mainland no exceptions. Mainland access=Mainland. Lowest cost non-Dubai=SHAMS or RAKEZ. Multiple shareholders=DMCC.
Respond ONLY valid JSON: {"recommendation":"2 sentences. Specific. One real cost figure.","setup":"ONE from: ${freeZoneOptions}"}`;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: vertical === 'itinerary' ? 2000 : (vertical === 'hotels' || vertical === 'dining') ? 1200 : 400,
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

    let bayutListingsUrl = null, bayutInsightsUrl = null;
    if (vertical === 'property') {
      const budget = budgetMap[answers.budget] || { min: 0, max: 5000000 };
      const typeSlug = typeSlugMap[answers.type] || 'property';
      const slugs = parsed.area ? areaSlugMap[parsed.area] : null;
      bayutListingsUrl = `https://www.bayut.com/for-sale/${typeSlug}/dubai/${slugs ? slugs.listing + '/' : ''}?price_min=${budget.min}&price_max=${budget.max}`;
      bayutInsightsUrl = `https://www.bayut.com/property-market-analysis/transactions/sale/property/dubai/${slugs ? slugs.tx + '/' : ''}`;
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
    if (vertical === 'credit-cards' && parsed.cards) {
      cardLinks = parsed.cards.map(c => ({ label: `Apply for ${c.name} (${c.bank})`, url: c.applyUrl || bankUrlMap[c.bank] || 'https://www.yallacompare.com/credit-cards/' }));
    }

    let itineraryDays = null, itineraryIntro = null;
    if (vertical === 'itinerary' && parsed.days) { itineraryDays = parsed.days; itineraryIntro = parsed.intro || null; }

    let hotels = null;
    if (vertical === 'hotels' && parsed.hotels) hotels = parsed.hotels;

    let restaurants = null;
    if (vertical === 'dining' && parsed.restaurants) restaurants = parsed.restaurants;

    res.status(200).json({ recommendation, bayutListingsUrl, bayutInsightsUrl, businessLinks, cardLinks, itineraryDays, itineraryIntro, hotels, restaurants, vertical });

  } catch (err) {
    res.status(200).json({ recommendation: 'Fetch error: ' + err.message, bayutListingsUrl: null, bayutInsightsUrl: null, businessLinks: null, cardLinks: null, itineraryDays: null, itineraryIntro: null, hotels: null, restaurants: null, vertical: '' });
  }
}

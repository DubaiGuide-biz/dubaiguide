# dubaiguide.biz — site code

## What's here
- index.html — home page
- property/ — Property matching quiz
- business/ — Business setup matching quiz
- api/match.js — calls Claude server-side to generate the recommendation
- api/lead.js — receives form submissions, logs them to your Vercel project's "Logs" tab

## The one thing you must do before this works
The AI matching won't function until you add your own Anthropic API key as an environment variable in Vercel:

1. Get a key at console.anthropic.com (separate from your claude.ai login — this is pay-as-you-go, costs are tiny for this volume)
2. In your Vercel project: Settings → Environment Variables
3. Add: ANTHROPIC_API_KEY = (your key)
4. Redeploy

## Where leads show up for now
Until a real CRM is connected, submitted leads appear in Vercel: your project → Logs tab. Search "NEW LEAD" to find them.

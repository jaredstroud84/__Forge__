# Forge — Deployment Guide

This folder is a complete, ready-to-deploy project. Three pieces:

- `index.html` — your marketing landing page
- `app.html` + `App.jsx` + `main.jsx` — the actual learning app (React)
- `api/claude.js` — the secure backend function that holds your API key
- `demo-reel.html` — the self-playing demo for recording ad footage

## Deploy steps (Vercel, free tier)

1. Create a free account at vercel.com
2. Create a new project and upload this entire folder (or push it to a GitHub repo and import it — either works)
3. In the Vercel project settings, go to "Environment Variables" and add:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your real key from console.anthropic.com
   (This keeps the key out of your code entirely — it's the whole point.)
4. Deploy. Vercel automatically turns `api/claude.js` into a live backend endpoint at `/api/claude`, and serves `index.html` and `app.html` as your pages.
5. In `App.jsx`, find `STRIPE_PAYMENT_LINK_HERE` (inside the paywall screen) and replace it with your real Stripe Payment Link — one flat $4.99 one-time Product/Payment Link. Set its "after payment" redirect to your deployed `app.html` URL **with `?unlocked=true` added on the end** — e.g. `https://yourapp.vercel.app/app.html?unlocked=true`. That query param is what unlocks the rest of the app after payment.
6. Redeploy.

## How the pricing actually works now

- Anyone can open the app and complete the **first 2 steps completely free**, no payment, no account.
- Trying to open step 3 shows a paywall screen: **a flat $4.99, every time, for every build** — no tiers, no discounts, no price creep.
- Fixed pricing is a deliberate choice: it's easy to repeat ("it's $4.99, that's it") which makes it far more shareable than a tiered price would be, and it's still comfortably profitable — typical API cost per completed build is roughly $0.10-0.30, so a $4.99 sale nets several dollars of margin even after Stripe's fee.


## After that

- Your landing page takes payment → redirects to the app → the app calls your own secure backend → nobody ever sees your API key.
- Redeploy any time you edit a file — Vercel free tier has no deploy limit that would affect you at this stage.

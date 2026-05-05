# Plan: Migrate Client Website Flow

Source of truth checked against `https://perfect-pair-match.base44.app` with
password `pre1970` on 2026-05-05.

## Top-Level Change

The public intake should have three separate entry flows:

- Buyer
- Seller
- Agent

Legacy `consumer` pages can remain as compatibility/demo routes, but primary CTAs
should now route to Buyer or Seller explicitly.

## Buyer Flow

Route family: `/buyer/*`.

1. Intro
   - Ask: `In what area(s) are you searching?`
   - Zip code input.
   - Intent choices:
     - `I am ready to buy a home`
     - `I am starting to explore what is out there`
     - `I am selling my home first and then buying next`
   - CTA: `Find My PRE Match`.

2. Email
   - Heading: `Where should we send your free fit snapshot?`
   - Copy: `We'll email your fit snapshot. No fee. No subscription.`
   - Buttons: `Continue`, `Skip for now`.

3. Core questions
   - Use existing Buyer question set from `core-questions.json`.
   - Official prompt order:
     - `In what price range are you looking to buy?`
     - `How soon would you like to be settled in your new home?`
     - `What type of home are you looking for?`
     - `How would you describe your level of experience with buying a home?`
     - `When you picture working with your ideal agent, what does that relationship look like?`
     - `How do you prefer to handle quick back-and-forth communications during your transaction?`
     - `How do you prefer to receive updates, timelines, and documents?`
     - `When you are close to making a big decision, what do you need most to move forward?`
     - `You just lost a bidding war on a home you loved. What do you need from your agent at that moment?`
     - `What is non-negotiable in your agent? (Choose up to 2)`
     - `How involved do you want to be in the details of buying your home?`
     - `When it comes to choosing an agent, which matters more to you?`
     - `When you reach out to your agent, how quickly do you expect a response?`
     - `How do you plan to handle commissions to your buyer's agent?`

4. Optional situation textbox
   - Prompt: `Is there anything about your situation that would help us find a better match?`
   - Helper: `Optional — the more you share, the better we can match you.`

5. Fit summary
   - Free snapshot before paywall.
   - Summarize preference profile and explain that PRE ranks by fit, not ad spend.

6. Unlock screen
   - Label: `UNLOCK MATCHES`.
   - Heading: `Meet the agent who actually fits you.`
   - Price: `$19.99`.
   - Copy: `One-time fee · No subscription · 100% refundable if no match`.
   - Buttons: `Unlock My Matches — $19.99`, `Review my Fit Summary first`.

7. Pax chat
   - Header: `Pax`, `Your Matching Guide`.
   - First prompt starts: `Hi, I'm Pax — your guide here on PRE. Pax means peace in Latin...`
   - Textbox placeholder: `Type your answer...`.
   - Buttons: `Generate My Matches`, `Skip for now`.

8. Results
   - Heading: `Your Top Matches`.
   - Copy: `Real agents ranked by fit — not by who paid the most to get your contact info.`
   - Should eventually support select up to 3 agents, intro request, and Pax practice.

## Seller Flow

Route family: `/seller/*`.

Seller mirrors Buyer, with seller-specific intro copy and question set.

1. Intro
   - Ask: `In what area is your property located?`
   - Zip code input.
   - Intent choices:
     - `I am ready to sell my home`
     - `I am starting to explore what selling looks like`
     - `I am selling first, then buying`
   - CTA: `Find My PRE Match`.

2. Email
   - Same as Buyer.

3. Core questions
   - Use existing Seller question set from `core-questions.json`.
   - Official prompt order:
     - `What do you estimate your home is worth?`
     - `How soon do you need your home on the market?`
     - `What type of property are you selling?`
     - `What is driving this sale?`
     - `Every seller wants a strong price. But when you imagine this sale going well, what does that actually look like?`
     - `How involved do you want to be in the details of selling your home?`
     - `How do you prefer to handle quick back-and-forth communications during your transaction?`
     - `How do you prefer to receive updates, timelines, and documents?`
     - `Imagine your agent truly delivered. When you look back on the experience, what made you feel that way? (Choose up to 2)`
     - `How would you describe your connection to this home?`
     - `When you're not hearing from your agent, what do you prefer?`
     - `When it comes to choosing an agent, which matters more to you?`
     - `When you reach out to your agent, how quickly do you expect a response?`
     - `How do you plan to handle commissions to your listing agent?`

4. Optional situation textbox
   - Same as Buyer.

5. Fit summary
   - Same as Buyer.

6. Unlock screen
   - Same as Buyer.

7. Pax chat
   - Same as Buyer.

8. Results
   - Same as Buyer with seller tip:
   - `Seller tip: Always request that buyer agent compensation is submitted with the offer — not agreed to upfront.`

## Agent Flow

Route family: `/agent/*`.

1. Intro and pricing explainer
   - Heading: `Tell Us About Yourself`.
   - Ask for primary representation:
     - `Buyer representation`
     - `Seller representation`
   - Copy should explain profile questions, license verification, contact details,
     and differentiation capture.
   - Pricing copy:
     - `$99 / month — keeps your profile active`
     - `Pause or cancel anytime. No contracts.`
     - `Shared intro $199`
     - `Exclusive intro $399`
   - CTA: `I'm in — build my profile`.
   - Note: `No payment required until you're ready to go live.`

2. Core questions
   - Use existing Agent question set from `core-questions.json`.
   - Last question remains open text:
   - `Who are you NOT the right fit for?`

3. Details and registration
   - Heading: `Your Details`.
   - Fields:
     - First name
     - Last name
     - Brokerage name
     - Email address
     - Telephone number
     - Business address
     - Billing address
     - License number & state
     - Service areas 1-3
     - Years licensed
     - Avg transactions / year over last 3 years
     - Full or part time
     - Proof of current license
     - Contract terms that put clients first
     - Value proposition, with option to use Pax AI writer
     - Short intro video upload/link
   - CTA: `Continue to Compliance Checklist`.

4. Compliance checklist
   - License active/good-standing attestation.
   - E&O insurance choices:
     - `Yes, I carry my own E&O policy`
     - `Yes, I am covered through my brokerage`
     - `No`
   - CTA: `Complete Registration`.

5. Peace Pact
   - Use full text from `peace-pact.md` when productionizing.
   - Required acknowledgment:
   - `I agree to uphold the Peace Pact in alignment with the NAR Code of Ethics and applicable regulations.`
   - Signature field: type full name.
   - Date shown: `5/5/2026` for current prototype.
   - Buttons: `Sign & Activate`, `Go back`.

6. Pax deep dive
   - Explain Pax will refine the agent profile and value proposition.
   - CTA: `Start Pax Chat`.

7. Pax chat
   - Ask what clients thrive with the agent, what promises they make, and where
     they create the most peace.
   - CTA: `Finish Profile`.

8. Subscribe
   - Heading: `Your profile is ready, Agent.`
   - Copy: `Pax has built your match profile. Subscribe to go live and start receiving pre-matched consumer introductions.`
   - Price: `$99 / month`.
   - Benefits:
     - Profile live in the PRE consumer marketplace
     - AI-matched consumers sent directly to you
     - Only pre-qualified intros — no tire-kickers
     - Pause or cancel anytime
   - Selection fees:
     - Shared intro: `$199`
     - Exclusive intro: `$399`
   - Clarify: agent can decline any intro at no charge; fees apply only when accepted.

## Follow-Up Implementation Gaps

- Payment is prototype-only; wire `$19.99` and `$99/month` to Stripe later.
- Pax chat is prototype-only; connect real chat/deep-dive service later.
- Results selection, compliance disclosure modal, Pax practice, intro request, and
  final pending-request screen still need full parity with source app.
- Peace Pact page currently uses condensed pact copy; replace with complete
  `peace-pact.md` render before launch.
- Persist these draft fields to database once auth-backed intake is connected.

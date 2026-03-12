# Guidera — Expense Tracker AI Prompts
> **Module:** `PROMPT_EXPENSE_RECEIPT` + `PROMPT_EXPENSE_SUMMARY` | **Version:** 1.0
> **Document type:** Two focused prompts covering the AI touchpoints inside the Expense Tracker
> **Engine:** Claude (Anthropic) via Supabase Edge Function

---

## Why The Expense Tracker Only Needs Two Prompts

Unlike every other Trip Hub module, the Expense Tracker is not AI-generated at trip creation. It's a **live data entry module** — the user logs expenses as they happen, and the app calculates and displays totals in real time. No pre-generation needed.

The AI earns its place in exactly two moments:

```
MOMENT 1 — RECEIPT SCAN                    MOMENT 2 — POST-TRIP SUMMARY
User snaps a receipt photo               Trip ends / user opens summary tab
        ↓                                          ↓
  Claude Vision parses it           Claude analyzes all logged expenses
        ↓                                          ↓
  Pre-fills the expense form          Generates narrative + insights
        ↓                                          ↓
  User reviews, edits, confirms        User sees their full trip spend story
```

Everything else — adding expenses, currency conversion, category totals, daily breakdowns, split calculations — is handled by the `ExpenseTrackerService` with no AI needed.

---

## PROMPT 1 — RECEIPT SCANNER (`PROMPT_EXPENSE_RECEIPT`)

> **Fires:** When user taps "Scan Receipt" and submits a photo
> **Input:** Receipt image (base64) + trip currency context
> **Output:** Pre-filled expense form data — user confirms before saving
> **Model config:** Vision-capable model, temperature: 0.1 (we want precision, not creativity), max_tokens: 400

---

### System Prompt

```
You are the receipt parser for Guidera, a travel app. Your job is to extract structured expense data from a receipt photo as accurately as possible. You output only valid JSON — no preamble, no explanation, no markdown.

The user is a traveler who just snapped a photo of a receipt. They want the expense entry form pre-filled so they can confirm or edit in one tap instead of typing everything manually.

EXTRACTION RULES:
1. TOTAL AMOUNT: Extract the final total paid — after tax, after any discounts. If you see multiple totals (subtotal, tax, total), always use the FINAL total.
2. CURRENCY: Identify from currency symbols (€, £, ¥, ₹, ฿, etc.), ISO codes, or country context from merchant name/language. If ambiguous, use the trip's destination currency provided in context.
3. MERCHANT: The name of the business. Clean it up — remove store numbers, excessive capitalization, trailing symbols. "STARBUCKS COFFEE #1284" → "Starbucks Coffee".
4. DATE: Extract from the receipt. Return in ISO format (YYYY-MM-DD). If not visible, return null.
5. TIME: If visible, return in HH:MM format. If not, return null.
6. CATEGORY: Classify into one of these exact category IDs:
   - "food" — restaurants, cafes, bars, street food, groceries, supermarkets
   - "transport" — taxis, Uber/Grab/Bolt, fuel, parking, metro, bus, train, ferry
   - "accommodation" — hotel extras, minibar, room service, resort fees
   - "activities" — museums, tours, entry tickets, experiences, sports
   - "shopping" — clothing, souvenirs, gifts, electronics, books, pharmacies
   - "entertainment" — nightlife, movies, concerts, clubs, casinos
   - "health" — pharmacies (medication specifically), doctor visits, hospital
   - "communication" — SIM cards, airport Wi-Fi, international calls
   - "tips" — tip-only receipts or receipts with a clear separate tip line
   - "other" — anything that doesn't fit above
7. LINE ITEMS: If individual items are clearly readable, list up to 8. This helps the user remember what the expense was for.
8. CONFIDENCE: Your overall confidence in the extraction (0.0–1.0). Be honest. A blurry photo or non-Latin script warrants lower confidence.

OUTPUT FORMAT — return ONLY this JSON, nothing else:
{
  "amount": 42.50,
  "currency": "EUR",
  "merchant": "Le Café de Flore",
  "date": "2025-03-14",
  "time": "13:22",
  "category": "food",
  "description": "Lunch",
  "line_items": [
    { "name": "Croque Monsieur", "amount": 16.00 },
    { "name": "Café au lait x2", "amount": 9.00 },
    { "name": "Tarte Tatin", "amount": 12.00 },
    { "name": "Service compris", "amount": 5.50 }
  ],
  "confidence": 0.94,
  "confidence_flags": [],
  "needs_review": false
}

CONFIDENCE FLAGS — add to the array when applicable:
  "blurry_image" — photo quality makes values hard to read
  "partial_receipt" — receipt appears cut off or folded
  "non_latin_script" — receipt is in Arabic, Chinese, Thai, etc.
  "multiple_totals_ambiguous" — unclear which total is the final amount
  "currency_unclear" — currency could not be determined with confidence
  "amount_unclear" — total amount not clearly readable

Set "needs_review": true if confidence < 0.80 OR any confidence_flag is present.

EDGE CASES:
- Split bill / "my share" receipts: extract the total shown, not a calculated split; the app handles splitting separately
- Receipts with tip line: if tip is already included in final total, extract the total; if tip line is blank/unsigned, extract the subtotal and note it
- Foreign language receipts: extract numbers and symbols regardless of language; use merchant name language as a hint for currency
- Digital receipts / screenshots: treat the same as physical receipts
- ATM withdrawal receipts: category = "other", description = "ATM withdrawal", amount = withdrawal amount
```

---

### User Message Structure

```typescript
// The message sent with each receipt scan
const userMessage = {
  role: 'user',
  content: [
    {
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',  // or image/png
        data: base64ImageData
      }
    },
    {
      type: 'text',
      text: `Trip context:
- Destination: ${destinationName} (${destinationCountry})
- Destination currency: ${destinationCurrency}
- Trip budget currency: ${budgetCurrency}
- Today's date (trip local): ${localDate}
- Trip day: Day ${currentTripDay} of ${totalTripDays}

Parse this receipt and return the expense data as JSON.`
    }
  ]
}
```

---

### Handling the Response

```typescript
async function parseReceipt(
  imageBase64: string,
  tripContext: TripContext
): Promise<ParsedReceipt> {

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 400,
    temperature: 0.1,
    system: RECEIPT_SYSTEM_PROMPT,
    messages: [buildReceiptUserMessage(imageBase64, tripContext)]
  })

  const raw = response.content[0].text.trim()
  
  let parsed: ParsedReceipt
  try {
    parsed = JSON.parse(raw)
  } catch {
    // Parsing failed — show manual entry form with error
    return {
      success: false,
      error: 'Could not read receipt. Please enter manually.',
      confidence: 0,
      needs_review: true
    }
  }

  // If AI flagged low confidence → pre-fill but show yellow banner
  // "We're not sure about some values — please double-check before saving"
  
  return {
    success: true,
    ...parsed
  }
}
```

---

### UX Flow After Receipt Scan

```
User taps "Scan Receipt"
  → Camera opens
  → User takes photo (or selects from camera roll)
  → Processing spinner: "Reading your receipt..."
  → (~2 seconds)

IF confidence ≥ 0.85 AND needs_review = false:
  → Form opens PRE-FILLED with all fields
  → Green indicator: "Receipt read successfully"
  → User taps "Add Expense" to confirm (or edits any field first)

IF confidence 0.65–0.84 OR needs_review = true:
  → Form opens with fields filled but flagged ones highlighted
  → Yellow banner: "Some values may need checking"
  → Specific flags shown: e.g., "Amount unclear — please verify"
  → User must manually confirm before saving

IF confidence < 0.65:
  → Form opens with whatever was extracted
  → Orange banner: "Couldn't read receipt clearly"
  → All fields editable
  → Receipt thumbnail stays visible for reference while user types
  → Original image saved to expense record either way (as receipt_url)
```

---

## PROMPT 2 — POST-TRIP SUMMARY GENERATOR (`PROMPT_EXPENSE_SUMMARY`)

> **Fires:** When user opens the Summary tab after trip ends, OR manually taps "Generate Summary"
> **Input:** All expense records for the trip + trip metadata
> **Output:** Narrative summary + key insights + comparison to budget
> **Model config:** temperature: 0.5, max_tokens: 800
> **Caching:** Cache the summary; only regenerate if new expenses added after generation

---

### System Prompt

```
You are Guidera's trip expense analyst. A traveler has just returned from a trip and you're generating their post-trip spending summary.

Your summary should feel like a smart friend reviewing the trip with them — warm, specific, and genuinely insightful. Not a dry spreadsheet readout. Surface the interesting patterns. Note what surprised them. Give them something they couldn't have noticed just by scrolling through their own receipts.

You output only valid JSON. No preamble, no markdown, no explanation.

TONE: Friendly, conversational, positive — even if they overspent. This is a post-trip memory as much as a financial report.

WHAT MAKES A GOOD INSIGHT (generate 3–5):
  - "Your biggest single day was Day 4 in Marrakech — mostly the private riad dinner"
  - "You spent more on transport than food, which is unusual for a city trip"
  - "The first 3 days averaged €85/day; the last 2 averaged €140/day — the pace picked up"
  - "Shopping was your #2 category — just ahead of food, which tracks for a Tokyo trip"
  - NOT: "You spent a total of €820" — that's a number, not an insight

BUDGET ASSESSMENT (if budget was set):
  - Under budget: celebrate it specifically ("You came in €180 under — that's nearly a free night's accommodation")
  - On budget: acknowledge the discipline
  - Over budget: be honest but not harsh; attribute it to something specific ("Most of the overage was in activities — worth it for the experiences")
  - No budget set: note total and suggest a benchmark for next time

OUTPUT FORMAT — return ONLY this JSON:
{
  "headline": "12 days in Japan: €1,840 across 94 expenses",
  "one_liner": "A food-heavy trip that stayed almost exactly on budget — with one very good splurge.",
  "budget_verdict": {
    "status": "under_budget",
    // "under_budget" | "on_budget" | "over_budget" | "no_budget_set"
    "amount_difference": 160,
    "currency": "EUR",
    "message": "You came in €160 under your €2,000 budget — about one extra night at the ryokan."
  },
  "daily_average": {
    "amount": 153.33,
    "currency": "EUR",
    "context": "For Japan, that's right in line with a comfortable mid-range trip"
  },
  "top_category": {
    "category_id": "food",
    "category_name": "Food & Drinks",
    "amount": 620,
    "percentage": 33.7,
    "highlight": "33 meals logged — from ¥400 ramen to the tasting menu in Kyoto"
  },
  "biggest_single_expense": {
    "amount": 285,
    "currency": "EUR",
    "description": "Dinner at Mizai, Kyoto",
    "day": 7,
    "category": "food"
  },
  "insights": [
    "Days 6–8 in Kyoto averaged €210/day — nearly double the Tokyo pace, mostly activities and dining",
    "Transport was your second-largest category at €290 — the Shinkansen passes alone were €180 of that",
    "You logged 0 expenses on Day 3 — either a very quiet day or a few receipts worth adding",
    "Shopping came in under €100 for a 12-day Japan trip, which takes real discipline"
  ],
  "category_breakdown": [
    { "category_id": "food", "name": "Food & Drinks", "icon": "🍽️", "amount": 620, "percentage": 33.7, "count": 33 },
    { "category_id": "transport", "name": "Transport", "icon": "🚗", "amount": 290, "percentage": 15.8, "count": 18 },
    { "category_id": "accommodation", "name": "Accommodation", "icon": "🏨", "amount": 480, "percentage": 26.1, "count": 6 },
    { "category_id": "activities", "name": "Activities", "icon": "🎫", "amount": 210, "percentage": 11.4, "count": 9 },
    { "category_id": "shopping", "name": "Shopping", "icon": "🛍️", "amount": 95, "percentage": 5.2, "count": 8 },
    { "category_id": "other", "name": "Other", "icon": "📦", "amount": 145, "percentage": 7.9, "count": 20 }
  ],
  "by_day_narrative": "Spending was front-loaded — the first 4 days in Tokyo averaged €120/day. The middle stretch in Kyoto jumped to €210/day. The final days wound down to €90/day.",
  "next_trip_note": "For a similar Japan trip, budget €160–180/day for comfortable mid-range travel including some special meals."
}
```

---

### Runtime Context Injected

```typescript
const summaryContext = `
TRIP: ${tripName}
DATES: ${departureDate} to ${returnDate} (${tripDurationDays} days)
DESTINATIONS: ${destinationsString}
BUDGET: ${budgetTotal ? `${budgetCurrency} ${budgetTotal}` : 'No budget set'}
TOTAL SPENT: ${budgetCurrency} ${totalSpent}
EXPENSES COUNT: ${expensesCount}

CATEGORY TOTALS:
${categoryTotals.map(c => `  ${c.name}: ${budgetCurrency} ${c.amount} (${c.count} expenses, ${c.percentage}%)`).join('\n')}

DAILY TOTALS:
${dailyTotals.map(d => `  Day ${d.day} (${d.date}): ${budgetCurrency} ${d.amount} (${d.count} expenses)`).join('\n')}

TOP 5 SINGLE EXPENSES:
${topExpenses.map(e => `  ${e.date} — ${e.merchant || e.description}: ${e.currency} ${e.amount} (${e.category})`).join('\n')}

TRAVELER COUNT: ${travelerCount}
TRIP PURPOSE: ${tripPurpose}

Generate the post-trip expense summary.`
```

---

### When to Fire This Prompt

```typescript
// Three triggers — all lazy (only generate when user opens Summary tab)

// Trigger 1: Trip has ended and summary doesn't exist yet
if (trip.status === 'completed' && !tracker.summary_generated_at) {
  generateSummary()
}

// Trigger 2: New expenses added after last summary generation
if (tracker.last_expense_added_at > tracker.summary_generated_at) {
  generateSummary()  // Regenerate — stale summary
}

// Trigger 3: User manually taps "Refresh Summary"
// → Always regenerate regardless of cache state
```

---

## What Needs No AI

To be explicit about what the `ExpenseTrackerService` handles without any prompt:

| Feature | Handled by | Notes |
|---|---|---|
| Add expense (manual) | CRUD service | Pure data entry |
| Currency conversion | `CurrencyService` | Live exchange rates, daily update |
| Category totals | Database aggregation | GROUP BY category |
| Daily totals | Database aggregation | GROUP BY day_number |
| Budget remaining | Simple subtraction | `budget_total - total_spent` |
| Budget % used | Simple division | Displayed as progress bar |
| Split calculation | Service logic | `amount / splitBetween.length` |
| Per-person totals | Service aggregation | For group trips |
| Export to CSV | Service utility | No AI needed |
| Budget alerts | Rule-based | Push notification at 75% and 100% of budget |

---

## Complete Expense Tracker AI Touch Map

```
Trip created
  → ExpenseTrackerService.initializeTracker() — NO AI
  → Sets budget currency, fetches exchange rate
  
During trip:
  → User adds expense manually — NO AI
  → User scans receipt — PROMPT 1 (Receipt Scanner)
  → CurrencyService auto-converts amounts — NO AI
  → Budget alert at 75% / 100% — Rule-based, NO AI
  
Trip ends / Summary tab opened:
  → PROMPT 2 (Post-Trip Summary Generator)
  → Cached until new expenses added
```

That's the full picture. Two prompts, both lightweight, both adding genuine UX value at the exact moments where manual effort would otherwise be required.

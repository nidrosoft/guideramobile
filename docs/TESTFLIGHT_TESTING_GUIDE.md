# Guidera TestFlight Testing Guide

**Version:** 0.1.0 (Build 1)  
**Platform:** iOS (TestFlight)

Thank you for helping us test Guidera! This guide walks you through the key features we'd like you to try. Please follow the steps in order and share any feedback, bugs, or suggestions you encounter along the way.

---

## Before You Begin

- Make sure you have **TestFlight** installed from the App Store.
- Open the TestFlight invitation link and install **Guidera**.
- Have a **stable internet connection** throughout testing.
- **Important:** When the app asks for location permissions, **tap "Allow While Using App"**. Location access is essential for many features to work correctly.

---

## Test 1: Account Setup & Onboarding

1. Open Guidera and tap **Sign Up**.
2. Create your account using your email or preferred sign-in method.
3. Follow each onboarding step carefully — fill in your name, date of birth, preferences, and other details as prompted.
4. **On the Location step** (the last step before the main setup screen):
   - Allow the app to detect your GPS location, **or**
   - Manually search for and select the city where you're currently located.
   - Confirm your location before proceeding.
5. Complete the final setup and land on the **Home Page**.

**What to look for:**
- Did the onboarding flow feel smooth and intuitive?
- Were you able to set your location without issues?
- Does the Home Page show content relevant to your location?

---

## Test 2: "Where Can We Take You?" (Smart Search)

This is the search bar at the top of the Home Page.

1. Tap the search bar that says **"Where can we take you?"**
2. Enter a **destination** you'd love to explore (e.g., "Bali", "Tokyo", "Barcelona").
3. Fill in the details:
   - **How many travelers** are going
   - **Travel dates**
4. Tap **Search** and **be patient** — the AI is gathering detailed information about your destination. This may take 15-30 seconds.
5. Once results appear, explore the information provided.

**What to look for:**
- Is the destination snapshot useful and accurate?
- Are the details (attractions, tips, weather, costs) helpful for planning?
- Did anything feel slow, broken, or confusing?

When you're done reviewing, close that page and return to the Home Page.

---

## Test 3: Plan Tab — Search for Flights, Hotels, Packages, Cars & Experiences

On the Home Page, locate the **Plan** section. You'll see **six category tabs**: Plan, Flight, Hotel, Package, Car, Experience.

1. Tap **Flight**:
   - Enter a destination and search for flights.
   - Review the results.
   - If you'd like, tap a result to see how the booking redirect works (it will take you outside the app to complete the booking — you don't need to actually book).

2. Tap **Hotel**:
   - Search for hotels at a destination of your choice.
   - Review the results and tap one to see details.

3. Repeat for **Package**, **Car**, and **Experience** — try at least 2-3 of these.

**What to look for:**
- Do search results load properly for each category?
- Are the results relevant to the destination you entered?
- Does the external booking redirect work?
- Any errors or empty results?

---

## Test 4: AI Guide (Ask Guidera AI)

1. Tap the **Launcher button** (the center button at the bottom of the screen).
2. Select **"Ask Guidera AI"**.
3. Ask it the following questions (one at a time):
   - *"What are the top 5 must-see attractions in Kyoto, Japan for a first-time visitor?"*
   - *"I'm planning a 4-day trip to Lisbon on a budget. What should I know?"*
   - *"What's the best time of year to visit Patagonia and what should I pack?"*
4. Review each response for quality and usefulness.

**What to look for:**
- Are the AI responses detailed and helpful?
- Does it respond within a reasonable time?
- Any errors or crashes?

---

## Test 5: Scan a Boarding Pass & Generate a Smart Trip Plan

This is a multi-step test. Follow each step carefully.

### Step 5A: Get a Sample Boarding Pass

You'll need an image of a boarding pass. Here's how to get one:

**Option 1 — Google Image Search:**
Search for *"boarding pass sample"* on Google Images and save one to your Camera Roll.

**Option 2 — Generate one with AI:**
Open ChatGPT, Gemini, or any AI image tool and use this prompt:

> *"Generate a realistic airline boarding pass image for a passenger named Alex Johnson, flying from New York JFK to Rome FCO on June 15, 2026, departing at 8:45 PM, seat 14A, flight AA192, arriving June 16, 2026. Make it a classic boarding pass layout with a barcode."*

Save the generated image to your Camera Roll.

**Important:** Make sure the boarding pass shows a trip of **5-6 days** (or imagine it as such) so the smart plan has multiple days to generate.

### Step 5B: Scan/Upload the Boarding Pass

1. Tap the **Launcher button** (center bottom).
2. Select **"Scan or Upload Ticket"**.
3. Choose the boarding pass image from your Camera Roll.
4. Submit it to the AI and wait for it to **extract all the trip details** (airline, destination, dates, etc.).
5. Once extracted, follow the on-screen instructions to **add this trip** to your Trips tab.

### Step 5C: Generate a Smart Plan

1. Navigate to the **Trips tab**.
2. Find the trip you just added.
3. Tap the **"Generate Smart Plan"** button.
4. **Be patient** — this takes about **60 seconds or more**. Feel free to navigate away from the app; you'll be notified when it's ready.
5. Once the button changes to **"Smart Plan Ready"**, tap the trip card to open it.

### Step 5D: Explore the Smart Plan

Once inside the trip, explore each section:

1. **Trip Planner** — Review the day-by-day itinerary. Does each day have a logical flow of activities?

2. **Packing List** — Browse the suggested items. Try **checking off a few items** to see if the checkboxes save properly.

3. **Journal** — Tap to create a new journal entry. Try:
   - Typing a short entry
   - Using **voice typing** (tap the microphone icon)
   - Saving the entry and confirming it persists

4. **Expense Tracker** — Add an expense:
   - **Option A:** Find a random receipt image online, take a screenshot, and use the Launcher to scan it
   - **Option B:** Manually add an expense with a name, amount, and category
   - Confirm the expense appears in the tracker

5. **Do's and Don'ts** — Read through the cultural tips for the destination. Are they relevant and helpful?

6. **Language Kit** — Review the common phrases for the destination language. Are they useful?

7. **Documents** — Check if this section is accessible and functional.

8. **Invite a Traveler** — In the Travelers section:
   - Tap **"Invite"**
   - Enter the email of someone you know
   - Send the invitation
   - **Confirm with that person** that they received the email

**What to look for across all sections:**
- Does the smart plan generate a reasonable itinerary?
- Do checkboxes, saves, and inputs persist properly?
- Does voice typing work in the journal?
- Did the invited person receive the email?
- Any crashes, errors, or missing data?

---

## Test 6: AI Vision — Menu Translation

1. Tap the **Launcher button** (center bottom).
2. Select **"AI Vision"**.
3. Navigate to the **Menu** tab.
4. Find a restaurant menu image online **in a foreign language** you don't speak (e.g., search Google for *"Japanese restaurant menu"* or *"French café menu"*).
5. Upload that menu image.
6. Wait for the AI to translate and identify the items.
7. Try to **add items** from the translated menu.
8. Attempt to **place an order**.
9. After following the order flow, **listen to the audio pronunciation** of your order.

**What to look for:**
- Did the AI accurately translate the menu items?
- Were you able to add items and place an order?
- Did the audio playback work clearly?
- Any issues with the upload or translation?

---

## Test 7: Explore Page — Content & Video Playback

1. Navigate to the **Explore** tab.
2. Scroll through the page — you'll see various sections like Best Discover, Budget Friendly, Trending, etc.
3. Tap on any place card (e.g., from **Budget Friendly** or **Best Discover**) to open its **detail page**.
4. Scroll down to the **Creator Content** section.
5. **Play the videos** — tap on them and watch.

**What to look for:**
- Do the videos play smoothly without buffering or freezing?
- Is the video player responsive (play, pause, scrub)?
- Is the creator content relevant to the destination?
- Any layout issues while scrolling?

---

## Test 8: Identity Verification (Trusted Traveler)

This step verifies your identity within the app.

1. Tap the **Profile/Account** tab.
2. Go to **Account Settings**.
3. Find and tap **"Trusted Traveler"**.
4. Follow the verification flow:
   - Upload or take a photo of your **government-issued ID** (driver's license, passport, etc.)
   - Take a **selfie** for identity matching
   - Submit for verification
5. Wait for the verification to process.

**What to look for:**
- Was the verification flow clear and easy to follow?
- Did the ID upload and selfie capture work properly?
- Did you receive confirmation of your verification status?
- Any errors during the process?

---

## Test 9: Connect Tab — Create an Event

1. Navigate to the **Connect** tab.
2. At the top of the Connect page, tap the **map icon**.
3. Tap the **"+"** (plus) button.
4. Select **Create an Event**.
5. Fill in the event details:
   - Give it a name (e.g., *"Sunset Rooftop Meetup"* or *"City Walking Tour"*)
   - Pick a category (e.g., Live Entertainment, Social Gathering, etc.)
   - Add a date, time, and location
   - Add a description
6. **Publish** the event.

**What to look for:**
- Was the event creation flow smooth?
- Did all fields save correctly?
- Does the published event appear on the map or in the events list?
- Any crashes or confusing steps?

---

## After You're Done

Thank you for taking the time to test Guidera! Here's how to share your feedback:

**For each test, please note:**
1. **What worked well** — Features that felt polished and useful
2. **What didn't work** — Bugs, crashes, or errors (screenshots help!)
3. **What was confusing** — Steps that weren't clear or felt unintuitive
4. **Suggestions** — Anything you'd improve or add

**How to report:**
- Take screenshots of any bugs or errors you encounter
- Note which test number and step the issue occurred at
- Send your feedback to: **[your feedback email/channel here]**

---

*Thank you for being part of the Guidera journey! Your feedback directly shapes the app experience for travelers worldwide.*

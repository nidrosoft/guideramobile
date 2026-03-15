# Pulse — Enhanced Activity Creation Flow

## Current State (Single Screen)
CreateActivityScreen.tsx — one long scroll with:
- Activity type grid (11 types)
- Title input
- Description input
- Location text input (auto-filled via GPS)
- Timing: 3 buttons (Right Now / Today / Tomorrow)
- Max participants input
- Create button

## Problems
1. Type cards have no borders — looks inconsistent with input fields
2. Timing limited to 3 options — no specific date/time picker
3. Location is text-only — no map pin drop
4. No visibility option (Open / Private)
5. No step-by-step flow — everything crammed into one scroll

## New Architecture (Multi-Step Bottom Sheet, Like NomadTable)

### Approach: Keep single screen but enhance it
Rather than a multi-step bottom sheet (which would require a major rewrite), we enhance the existing screen with:
1. **Borders on type cards** — match input field borders
2. **Enhanced date/time picker** — next 5 days + flexible/specific time
3. **Map location picker** — bottom sheet with pin drop
4. **Open/Private toggle** — simple 2-option selector

### Files to Create/Modify

| File | Lines | What |
|------|-------|------|
| `CreateActivityScreen.tsx` (modify) | ~450 | Add borders, date section, visibility toggle |
| `pulse/ActivityDatePicker.tsx` (new) | ~200 | Date chips (Today → +5 days) + Flexible/Specific time toggle + time picker |
| `pulse/ActivityLocationSheet.tsx` (new) | ~250 | Bottom sheet with MapView + draggable pin + "Set Location" button |

### Date Picker Design (from NomadTable screenshots)
```
When?

[Today 14] [Sun 15] [Mon 16] [Tue 17] [Wed 18]  ← horizontal scroll

[📅 Flexible time     ] [🕐 Set specific time  ]
 Anytime during the day   Choose exact time

Activity will be visible on map until midnight
```

- 5 date chips showing day name + date number
- Today highlighted in primary color
- Two cards: Flexible (default) or Specific
- If specific: show time picker (hours:minutes)

### Location Picker Design (from NomadTable screenshots)
```
┌──────────────────────────┐
│ [General] [Specific]     │  ← toggle
│                          │
│ 📍 Choose a general area │
│ If not sure about exact  │
│                          │
│    ┌──── MAP ────┐       │
│    │     📍      │       │
│    │   (pin)     │       │
│    └─────────────┘       │
│                          │
│ [  Set Activity Location ]│
└──────────────────────────┘
```

- Full-screen modal with map
- General (radius) or Specific (exact pin)
- Draggable pin at center
- Reverse geocode to show address
- "Set Activity Location" button confirms

### Visibility Design
```
Who can join?

[👥 Open          ] [🔒 Private        ]
 Anyone can join    Approval required
```

Simple 2-card toggle, default: Open

## Execution Order
1. Fix type card borders (quick CSS fix)
2. Build ActivityDatePicker component
3. Build ActivityLocationSheet component  
4. Add visibility toggle to CreateActivityScreen
5. Wire everything together

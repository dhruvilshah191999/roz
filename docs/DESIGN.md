# Roz — Design

## 1. Principles

- **Web, not app.** It opens in Chrome on Android with no install. So: a web header with text navigation, no bottom tab bar, no fake status bar, nothing pinned to the bottom edge. Pages scroll.
- **Phone first, laptop second.** Content column is capped at 480px and centred on a light ground. Laptop gets the same page, not a second layout.
- **Fewest words.** Every game is symbols only. Labels are one or two words. Numbers beat sentences.
- **Looks like a product, not a template.** No gradients, no glass, no emoji, no purple, no left-border cards, no Inter/Roboto/Arial. Flat fills, 1.5px borders, one accent per job.
- **Money is visible.** Coins show their rupee value. Every earn and spend has a ledger row. Rewards say "demo" on the page.
- **Touch targets 44px or larger.** Grid cells are 52 to 62px.

## 2. Visual system

### Colour
| Role | Hex | Use |
|---|---|---|
| Ground | `#F1F2EE` | Page background outside the column, muted fills, hint boxes |
| Surface | `#FFFFFF` | Column background, cards |
| Ink | `#141414` | Text, primary buttons, outer grid border, nav underline |
| Muted text | `#5C5F58` | Secondary copy, inactive nav |
| Border | `#E2E4E0` | Card borders, dividers |
| Green | `#1D7A4A` | Progress, done states, solved check, level bar, positive ledger rows |
| Green tint | `#E6F4EC` | Done icon tile, restore info box, watered house |
| Coin yellow | `#FFE98A` pill, `#F2B300` icon | Coin pill, balance card, coins-today row |
| Amber tint | `#FFF4D6` | Warnings: coins not protected, PIN cannot be reset |
| Amber ink | `#9A6700` | Lock icon stroke |
| Blue | `#2563EB` | Wet pipes, tank |
| Blue tint | `#E3EEF9` | Pipes icon tile, wet tile background |
| Pipe grey | `#A3A9B3` | Dry pipes |
| Zip path | `#E9A23B` | The drawn path only |
| Streak flame | `#E4572E` | Flame icon only |

### Type
- Headings: **Bricolage Grotesque** 800. Page titles 32px, section headings 20 to 24px, big numbers 34 to 44px with tabular numerals.
- Body: **Public Sans** 400/600/700. Body 14 to 15px, captions 12 to 13px, eyebrow labels 13px uppercase with 0.6px tracking.
- Codes and coupon strings: system monospace, 1px tracking.
- Both fonts are free on Google Fonts; load with `next/font` so they are self-hosted and subset.

### Shape and spacing
- Page gutter 20px. Card padding 14 to 16px. Cards radius 16px, buttons 14px, pills 999px, grid cells 10px.
- Borders 1.5px. The "in progress" card gets an ink border; others get the light border.
- Primary button: ink fill, white text, 52px tall. Secondary: white fill, ink 1.5px border. Tertiary: light border.

## 3. Shared header (every page except in-play and flows)

```
[Roz]                 [● 1,240] [🔥 12 days]
Play   Ranks   Rewards   Me
────────────────────────────────────────
```
- Wordmark links Home. Coin pill links Rewards. Streak pill is static.
- Nav is a row of text links; the active one is bold with a 2px ink underline.
- Flame is an inline SVG, not an emoji.

In-play and flow pages (Zip, Pipes, Flash, Solved, Restore, Set PIN) use a compact bar: back link on the left ("Today" or "Me"), page name centred, timer or an empty spacer on the right.

## 4. Screens

### 4.1 Home
1. Eyebrow with the date, title "Today's three".
2. Dark strip: "1 of 3 done" left, "Finish all 3 · +15 coins" right in coin yellow, three segment bars beneath (green for done).
3. Three game cards, each: 52px icon tile, name, one-line description, right-side state.
   - Done: green check with time, "+15 coins" caption.
   - In progress: ink "Continue" pill, "1:12 so far" caption, ink card border.
   - Not started: outlined "Play" pill, "about 1 min" caption.
4. Amber nudge (only while unprotected): lock icon, "Coins not protected. Set a PIN so you keep them on any phone.", chevron. Links to Me.
5. Footer row: "Want more? Practice puzzles earn no coins." with a Practice link.
6. Small grey footer links: "New puzzles at midnight", "Restore account", "Rewards are demo only".

### 4.2 Zip (in play)
- Compact bar: Today · Zip · timer.
- Line: "Draw from **1** to **6** through every box" with hint dots on the right (filled green = free hint left, hollow = used).
- Board, 336px max, square: white, 2px ink rounded outer border, 1px grey inner lines. Numbers in 32px black circles with white digits. The path is one continuous 30px-wide orange line with round caps and joins through cell centres. Walls are 6px ink segments on cell edges.
- Caption: "Timer keeps running if you leave this page. Par today is 1:30."
- Buttons: "Hint · free" (secondary, bulb icon) and "Clear path" (tertiary). Auto-submits on completion; a green "Check" is kept as a fallback.
- Grey how-to box at the bottom, three sentences.

### 4.3 Pipes (in play)
- Same bar and caption pattern, par 2:00.
- Line: "Tap a pipe to turn it. **1 of 5** houses have water."
- 5×5 grid of 10px-radius tiles. Tank is a filled blue rectangle with an outlet. Pipes are 11px strokes, blue when wet, grey when dry. Houses are a filled house shape, grey when dry, green when wet; tile background tints to match.
- Buttons: "Hint · 1 free left", "Reset".

### 4.4 Flash (in play, not drawn on the canvas)
- 3×3 tiles, about 90px. Lit: coin yellow. Correct tap: green. Wrong tap: flame red. A mistakes counter replaces the timer ("0 mistakes").
- Status line: "Round 2 of 3 · 4 tiles · tapped 1". A green "Watch" button starts each round; "Watch again" replays and costs a mistake.
- Buttons: Hint (next tile), Watch again.

### 4.5 Solved
- Green 72px circle with a check, "Solved", time in 44px, "Par was 1:30. You beat it."
- Itemised coin table: Solved +10, Under par +5, Streak day 12 +20, total row in coin yellow.
- Dark strip: "2 more puzzles for the set bonus · +15".
- Primary "Next: Pipes" (or "Back to today" after the third), secondary "Share my time".
- Grey box showing the exact text that Share copies:
  ```
  Roz · 13 Oct
  Zip 0:48 · Pipes – · Flash –
  Streak 12 · <site url>
  ```
- First solve ever: an inline "Your name for Ranks" field with Save and Skip appears above the buttons.

### 4.6 Ranks
- Eyebrow "Week 42 · ends Sunday", title "Ranks", segmented control This week / All time.
- One-line rule: "Fastest total time across all three puzzles, added up over the week."
- Your row pinned in a dark card: rank, name, days played, time.
- List: rank (green for top 3), initial avatar in a pastel circle, name, days, time.
- Footer: "Top 3 on Sunday get 100 bonus coins."

### 4.7 Rewards
- Eyebrow "100 coins = ₹1", title "Rewards".
- Yellow balance card: coins left, rupee worth right.
- Dashed grey "Demo rewards" box.
- Three tier cards: "₹5 coupon · 500 coins", brand chips (Amazon, Flipkart, Zomato as text), button "Get coupon" (ink) or "760 more coins" (disabled grey).
- "My coupons": brand, monospace code, date and coin cost, Copy button.

### 4.8 Me
- Avatar initial, name, "Change name" link, level number.
- Green level bar with "1,240 lifetime coins" and "Level 5 at 2,000".
- Three stat tiles: Streak, Best streak, Solved.
- Amber card: "Coins not protected", explanation, account code with Copy, ink "Set a 4-digit PIN" button. Once protected this becomes a slim green "Protected" row with "Change PIN".
- "Coin history" list: reason, when, signed amount (green for positive).
- Links: "Restore another account", "How coins work".

### 4.9 Restore
- Title "Played before on another phone?", one sentence.
- Fields: Account code (monospace, uppercase), 4-digit PIN (numeric keypad).
- Green info box: "You earned 100 coins on this phone. They will be added to the account you restore. Nothing is lost." (only when the throwaway account has coins).
- Primary "Restore my account".
- Grey box: what to do if no PIN was set. Line about the five-attempt lock.

### 4.10 Set PIN
- Title "Keep your coins on any phone".
- Step 1 card: account code with Copy, "Write it down or send it to yourself on WhatsApp."
- Step 2: PIN and repeat PIN.
- Amber box: "We cannot reset a forgotten PIN."
- Primary "Save PIN".

## 5. States and copy rules

- Empty ranks: "No one has finished a set this week. Be first."
- Hint with no coins: button reads "Hint · 5 coins" and is disabled with "Not enough coins" caption.
- Offline or failed submit: inline red-free message in ink on amber: "Could not save. Check your connection and tap again." The board state is kept.
- All copy at a reading level a second-language reader can follow: short sentences, no idioms, numbers as digits.

## 6. Responsive behaviour

- Column `max-width: 480px; margin: 0 auto`. Ground colour outside.
- Boards use `width: 100%; max-width: 336px; aspect-ratio: 1`, so they shrink on 320px-wide phones without overflow.
- Nav links wrap if a translation ever makes them longer.
- No horizontal scroll anywhere; tables are avoided in favour of row lists.

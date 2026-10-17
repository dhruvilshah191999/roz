# Roz — Implementation plan

Build task for Kenpath Labs (Full Stack Engineer). Product name: **Roz** (Hindi for "daily"). The number of games is a registry, not a fixed three.
Companion docs: `DESIGN.md` (screens and visual rules), `ARCHITECTURE.md` (stack, data model, API).

## 1. The idea in one paragraph

A mobile web app (not a native app) that gives everyone the same three one-minute puzzles each day. Solving pays coins, finishing all three pays a bonus, a streak pays more, and coins can be exchanged for demo coupons. No login to play; an optional PIN protects coins across phones and browsers. Built for modest Android phones on mobile data and for people who read English as a second language, so every game is symbol-only and every screen has as few words as possible.

## 2. What the brief asks for, and how each point is met

| Brief | How we meet it |
|---|---|
| Responsive web app people open every day | Same puzzles for everyone each day, reset at midnight IST, streak counts only a full set |
| Short task, rewarded | Three puzzles, about a minute each, coins per solve plus bonuses |
| Streaks, levels, points, badges, leaderboard, daily challenge | Streak with weekly shield, levels from lifetime coins, coins, weekly ranks, daily set. Badges deliberately left out (see section 9) |
| Modest Android, mobile data | No component library, Tailwind v4 purged CSS, puzzles are a few hundred bytes of JSON, no images, no canvas |
| English as a second language | Logic puzzles with no reading, short labels, numbers over words, rupee value shown next to coins |
| Earnings are worth real money | Server-side validation of every solve, a ledger of every coin movement, rewards page states the exchange rate and that codes are demo |
| Live link on a free tier | Vercel plus Neon Postgres |
| README from clone to run | One service, one env var, one migration command |
| Explainer | `EXPLAINER.md` in the repo plus a short section on where AI tools were used |

## 3. The three games

All three are language-free, one-thumb, and server-verifiable.

### Zip (kept from LinkedIn, the familiar anchor)
- 6×6 grid. Draw one path from 1 to N through every cell, visiting the numbers in order. Some cell edges carry walls the path cannot cross.
- Generator: random Hamiltonian path by randomised backtracking, pick N checkpoints along it (first and last fixed), then add walls on edges the path does not cross until the solver finds exactly one solution or a wall cap is hit.
- Validation: path covers all 36 cells, consecutive cells are adjacent, no wall crossed, numbers visited in order.
- Hint: next correct cell from the end of the user's current path. If the current path cannot be completed, the hint says how many cells to keep.
- Par: 1:30.

### Pipes (new)
- 5×5 grid. A tank in one cell, houses on the leaves. Tap a tile to rotate it a quarter turn clockwise. Water flows from the tank through connected pipe ends. Solved when every house is wet.
- Generator: random spanning tree over all cells (randomised Prim). Every leaf except the tank becomes a house. Tile shape comes from the tree degree: straight, corner, T, cross. Shuffle rotations.
- Validation: flood fill from the tank over mutually connected ends; all houses reached.
- Hint: one wrong tile is set to its correct rotation and locked.
- Par: 2:00.

### Flash (new)
- 3×3 grid. Tiles light up one by one; tap them back in the same order. Round 1 shows 3 tiles, each round adds one, 3 rounds.
- Generator: one fixed sequence of 5 tiles from the seed, no tile repeated back to back.
- Validation: the client sends every attempt; the server replays them in order. An attempt that is not exactly the round's prefix is a mistake. Solved when round 3 is reproduced.
- Hint: the next tile to tap in the current round.
- Par: 1 mistake. "Watch again" also counts as a mistake.
- Replaced Lights Out ("Switch Off"), which was built first and dropped because it needs a trick most people never find.

Practice mode: unlimited random puzzles generated in the browser from a random seed. No server call, no coins.

## 4. Coin economy

| Event | Coins |
|---|---|
| Solve a daily game | +10 |
| Solve under par with no hints used | +5 |
| Finish all three (full set) | +15 |
| Streak bonus, paid with the full set | +2 per streak day, capped at +20 |
| Hint after the two free ones per game per day | −5 |
| Practice mode | 0 |
| Weekly top 3 on Sunday night | +100 (stretch) |

A perfect day is about 60 coins. Exchange rate is **100 coins = ₹1**, stated on the Rewards page. Coupon tiers: 500 coins = ₹5, 1,000 = ₹10, 2,000 = ₹20. Brands Amazon, Flipkart and Zomato appear as plain text labels only, codes look like `DEMO-4K2P-91QX`, and the page says they are demo codes.

Levels from lifetime coins earned (not balance): thresholds 0, 200, 500, 1,000, 2,000, 3,500, 5,500, 8,000, then +3,000 each.

## 5. Streak rules

- A day counts only when all three daily puzzles are solved.
- Puzzle day is the calendar date in **Asia/Kolkata**. A solve submitted at 00:02 for a puzzle started at 23:58 counts for the puzzle's date, not the submit date.
- Streak shield: if exactly one day was missed and no shield was used this ISO week, the streak continues and the shield is marked used. Shown on the Me page as "1 shield left this week".

## 6. Accounts without a login screen

1. First visit, no cookie: server creates an account, sets an httpOnly cookie with a random token, user is playing within two taps.
2. Every account gets an **account code** at creation, shape `WORD-1234` (simple noun plus four digits).
3. After the first solve the result screen asks for a display name for Ranks. Skippable; default is `Player 4821`.
4. After the first solve, and again when the balance passes 100, an unprotected account sees one prompt to set a 4-digit PIN.
5. **Restore** on another browser: enter code plus PIN. On success the cookie is pointed at the old account and the throwaway account created on this browser is merged into it: its coins and ledger rows move across, and if both played today's puzzles the old account's results win. The throwaway account is then deleted. The Restore page says this before the button is tapped.
6. No PIN reset exists, because we hold no phone or email. The Set PIN page says so. Five wrong PINs lock restore for one hour.

## 7. Timer and leaving mid-game

- The server stamps the start time the first time a daily puzzle is opened. Solve time is submit time minus start time, measured on the server, so a tampered client cannot post a fake time.
- Leaving and coming back resumes the same board: moves are saved in `localStorage` under the date and game; hints used and start time live on the server. Local storage for a day is dropped when a new date arrives.
- The timer keeps running while the user is away. The page says so before the first tap. This costs only the under-par bonus and rank, never the solve coins.
- Home shows each game as Not started, In progress or Done.
- Practice puzzles are not saved.

## 8. Leaderboard

- Weekly, Monday to Sunday IST.
- Rank by number of full sets this week (descending), then by total solve time (ascending). Consistency first, then speed.
- The user's own row is pinned at the top of the list.
- "All time" tab ranks by lifetime coins earned.

## 9. Left out on purpose (goes in the explainer)

- Badges: they add UI without adding a reason to come back; the streak and the set bonus already do that job.
- A second puzzle type beyond the three; a fourth game (Flash, a memory game) is the next candidate.
- Phone OTP login: needs a paid SMS provider and lengthens setup.
- Push notifications, analytics, error tracking, dark mode.
- Service worker / offline play: a stale cached puzzle would be worse than a short load.
- Real coupon fulfilment.

## 10. Build order (4 to 6 hours)

1. Scaffold Next.js 16 + Tailwind v4 + Drizzle + local Postgres in Docker. Schema and migration. (30 min)
2. Game engines in `src/lib/games/` as pure TypeScript with unit tests: generate, validate, hint, for all three. (90 min)
3. Account cookie, daily puzzle endpoint, start/hint/submit endpoints, scoring and ledger. (60 min)
4. Pages: Home, Play (three boards), Result, Ranks, Rewards, Me, Restore, Set PIN. (90 min)
5. Restore and merge flow, redeem flow. (30 min)
6. README, EXPLAINER, deploy to Vercel with Neon, test on a phone. (30 min)

## 11. Deliverables checklist

- [ ] Live URL on Vercel, opened and tested on an Android phone over mobile data
- [ ] GitHub repository with README (clone → run in under five minutes)
- [ ] `EXPLAINER.md`: what was built, choices, what was left out, where AI tools were used
- [ ] Unit tests for engines and scoring, one command
- [ ] Decision recorded on the hidden "Ref: KL-7Q4" README line (include or omit; it signals AI use)

## 12. Open decisions

- App name: "Roz" is a placeholder.
- Whether Ranks and Rewards widen to two columns on desktop or stay single column (current call: single column, phone-first).
- Whether to ship the practice link on Home in v1.

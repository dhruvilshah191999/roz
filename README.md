# Roz

A few small puzzles every day. Solve them, earn coins, keep your streak.

Roz is a mobile web app built for the Kenpath Labs build task. Everyone gets the same set of puzzles each day (today: Zip, Pipes and Flash). Solving pays coins, finishing the whole set pays a bonus, a streak pays more, and coins can be exchanged for demo coupons. There is no login: an account is created silently on first visit, and an optional 4-digit PIN protects the coins across phones and browsers.

- **Live:** _add your Vercel URL here_
- **Explainer:** [EXPLAINER.md](EXPLAINER.md)
- **How it works, in plain words:** [docs/HOW-IT-WORKS.md](docs/HOW-IT-WORKS.md)
- **Architecture:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Design:** [docs/DESIGN.md](docs/DESIGN.md)

## Run it locally

You need Node 20 or newer and Docker (for Postgres). About five minutes.

```bash
git clone <this repo> roz
cd roz
npm install

# 1. Postgres on localhost:5433
docker compose up -d

# 2. Environment
cp .env.example .env.local        # defaults already point at the Docker database

# 3. Tables
npm run db:migrate

# 4. Go
npm run dev                       # http://localhost:3000
```

Open it on your phone too: find your laptop's LAN IP and visit `http://<ip>:3000` from the same Wi-Fi.

No Docker? Point `DATABASE_URL` in `.env.local` at any Postgres 14+ database and skip step 1.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm test` | Unit tests for the three game engines and the scoring rules |
| `npm run typecheck` | TypeScript check |
| `npm run build` / `npm start` | Production build and server |
| `npm run db:generate` | Generate a migration after editing `src/lib/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` |
| `npm run db:studio` | Browse the database |

### Environment variables

| Name | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `DAILY_SEED_SECRET` | Mixed with the date to seed each day's puzzles. Any long random string. |
| `NEXT_PUBLIC_SITE_URL` | Shown in the share text. Optional. |

## How a day works

1. The puzzle day is the calendar date in India (Asia/Kolkata). New puzzles at midnight.
2. Each game is generated once per day from a seed and stored in `daily_puzzles`. Solutions never leave the server.
3. Opening a puzzle stamps a start time on the server. The solve time is measured there too, so a tampered client cannot post a fake time. Leaving the page keeps the clock running, and the page says so.
4. Every solve, bonus, hint and coupon is a row in `ledger`. The balance is a cache of that table.

| Event | Coins |
|---|---|
| Solve a daily game | +10 |
| Solve under par with no hints | +5 |
| Finish every game that day | +15 |
| Streak bonus, paid with the full set | +2 per day, capped at +20 |
| Hint after the two free ones per game | −5 |

100 coins = ₹1. Coupons at 500, 1,000 and 2,000 coins are demo codes only.

## Project layout

```
src/
  app/                 pages and API routes (Next.js App Router)
    api/               thin route handlers: read cookie, call lib, return JSON
    play/[game]/       one page for every game, daily or ?practice=1
  components/
    boards/            one dumb board per game: draws the grid, reports taps
    play/              the play screen: useGameSession (start, timer, hints, submit),
                       PlayLayout, PlayActions, HintDots, and games/<Game>Play.tsx per game
    result/            the solved screen split into hero, coin table, set banner, share box
    Header, GameCard, PinNudge, PageTitle, StatTile, forms
  lib/
    games/             game engines: generate / validate / hint. Pure TypeScript, no framework.
      index.ts         the game registry. Add a game = one entry here + one board component.
    play.ts            start / hint / submit, all scoring inside transactions
    scoring.ts         coin rules, streaks, levels, IST dates
    accounts.ts        silent accounts, account codes, PIN hashing, restore + merge
    daily.ts           seeded daily puzzles, per-day state
    leaderboard.ts     weekly and all-time ranks
    rewards.ts         tiers, brands, demo codes
    db/                Drizzle schema and client
tests/                 vitest: engines and scoring
drizzle/               generated SQL migrations
docs/                  plan, design spec, architecture
```

## Adding a game

1. Write `src/lib/games/<name>.ts` with `generate(rng)`, `toPublic(puzzle)`, `validate(puzzle, solution)` and `hint(puzzle, state)`.
2. Add an entry to `GAMES` in `src/lib/games/index.ts`.
3. Add a board under `src/components/boards/` and a small `src/components/play/games/<Name>Play.tsx` that wires the board to `useGameSession`, then register it in `src/components/play/registry.ts`.
4. Add a test under `tests/`.

Home cards, the daily set, the set bonus, ranks and the share text all read the registry, so nothing else changes.

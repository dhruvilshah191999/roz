# Roz — explainer

## What I built

Roz ("daily" in Hindi) is a mobile web app with a small set of puzzles that changes every day. Right now the set is three games, all playable with one thumb and no reading:

- **Zip**: draw one path from 1 to 6 through every box, past walls. Familiar to anyone who has played the LinkedIn one, which is why it is the anchor game.
- **Pipes**: tap tiles to rotate pipes until water from the tank reaches every house.
- **Flash**: tiles light up one by one, tap them back in the same order. Three rounds, one more tile each round. A wrong tap replays the round; par is one mistake.

What brings people back:

- **The same puzzles for everyone, reset at midnight IST.** You can compare times with friends and the share text works in WhatsApp.
- **Coins with a stated value.** 10 for a solve, 5 more for beating par without hints, 15 for finishing the whole set, and a streak bonus. 100 coins = ₹1, written on the Rewards page. Every coin movement is a ledger row the user can read.
- **Streak with one shield a week.** A streak counts only when the whole set is done. Missing one day does not break it if the weekly shield is unused.
- **Weekly ranks** by full sets completed, then total time. Your own row is pinned so you never scroll to find yourself.
- **Levels** from lifetime coins, so spending coins on rewards never costs rank or level.
- **Demo coupons** for Amazon, Flipkart and Zomato, as text labels only, with codes that say DEMO.

## Choices I made, and why

**No login screen.** The brief says users are on modest Android phones, read English as a second language, and the coins are worth real money to them. A sign-up wall is the worst first impression on a phone, and every form field is friction for a second-language reader. So an account is created silently on first visit behind an httpOnly cookie. After the first solve the app asks for a display name (skippable) and, once there is something worth protecting, nudges once to set a 4-digit PIN. Every account has a code like `MANGO-7342`. Code plus PIN restores the account on any other phone or browser, and any coins earned on the new phone before restoring are merged in, which the Restore page says before the button is tapped. The trade-off is that a forgotten PIN cannot be reset, because we hold no phone number or email. The Set PIN page says so plainly.

**Everything that touches coins happens on the server.** Puzzles are generated from a secret seed and stored with their solution, which is never sent to the client. Start time is stamped on the server, the solve is validated on the server, and the time is measured on the server. The timer keeps running if you leave the page, and the page tells you that before the first tap. It costs only the under-par bonus and rank, never the solve coins. Hints are counted server-side so a reload cannot reset them.

**Mobile web, not an app.** The pages are ordinary web pages with a text navigation row, no bottom tab bar, no fake status bar, nothing pinned to the bottom edge. The column caps at 480px and centres on a laptop, so one layout serves both. The page has a manifest so "Add to home screen" works on Android.

**Light on data.** No images, no canvas, no component library. The boards are divs and inline SVG. A day's puzzles are a few hundred bytes of JSON. Tailwind v4 ships only the classes used.

**A registry, not three hard-coded games.** `src/lib/games/index.ts` is a list. Home cards, the "x of n done" strip, the set bonus, ranks and the share text all read it, so adding or removing a game is one entry plus one board component. The product is the daily habit, not a specific count.

**Next.js only, no separate API server.** One deployable and one environment variable makes "clone to running" short. The domain logic lives in `src/lib/` as framework-free TypeScript with unit tests, so it could be lifted into a standalone service without rewriting it.

**Puzzle generation details.** Zip builds a random Hamiltonian path, picks six checkpoints, then adds walls on edges the path does not use until the solver finds exactly one solution (best effort under a node cap; any valid path is accepted at submit, so a non-unique day is still fair). Pipes builds a random spanning tree by depth-first walk, which gives long runs and few dead ends; the dead ends become houses. Flash is one fixed sequence of five tiles per day with no tile repeated back to back; round r shows the first r + 2 tiles. The server replays every attempt the client sends, so "solved" and the mistake count are decided server-side even though the sequence itself must reach the client to be shown. All three are deterministic for a given seed, so every server instance agrees on today's puzzle.

## What I left out, on purpose

- **Badges.** They add screens without adding a reason to come back; the streak and the set bonus already do that job.
- **Phone-number OTP login.** It needs a paid SMS provider and lengthens setup. The code-plus-PIN scheme covers the real need, which is moving coins to a new phone.
- **Offline play and a service worker.** A stale cached puzzle would be worse than a short load.
- **The weekly top-3 bonus payout.** The ranks page promises it; the scheduled job that pays it is not written. It would be a Vercel cron hitting an internal route.
- **Push notifications, analytics, error tracking, dark mode.**
- **Real coupon fulfilment.** Out of scope, and the page says so.
- **A fourth game.** The registry makes it one entry; Match Pairs is the next candidate. An earlier third game, Lights Out, was built and then replaced by Flash because it needs a trick most people never find.

## Known rough edges

- Switching browsers before setting a PIN loses access to that browser's coins. The nudge after the first solve and on the home page is the mitigation.
- Zip's uniqueness search is capped for speed, so on rare days a puzzle may have more than one valid path. The validator accepts any valid path.
- Hints in Pipes lock the tile they fix; Reset keeps locked tiles in place. This is intentional but not explained on the page.
- Flash's sequence is visible to anyone who opens devtools. Coins for one solve are small, and the ranks use time, so the incentive to cheat is low; a server-driven reveal would fix it at the cost of a round trip per tile.

## Where I used AI tools

_Edit this section before sending so it reflects what you actually did._

I used an AI coding assistant as a pair programmer throughout: to talk through the product idea and the no-login account model, to draft the screen designs, and to write the first version of most of the code, including the game engines, the scoring rules, the API routes and the pages. I reviewed and ran everything locally, exercised every API flow end to end, and checked each screen at phone width. The planning notes in `docs/` are the record of those conversations.

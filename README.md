# Weight Track

A local-first mobile app for logging the weights and reps you lift at the gym.
Built with Expo (React Native) + expo-router + SQLite.

## Features

- **Exercises** — create exercises (with optional muscle-group tag), search/filter,
  and view full per-day history.
- **Day logging** — add an auto-dated workout day, enter any number of sets
  (reps + weight, kg or lb per set), edit or delete inline.
- **Progressive overload** — "copy last session" and a last-session reference hint
  when logging.
- **Progress + PRs** — per-exercise estimated-1RM chart (Epley) with automatic
  personal-record detection and all-time stat tiles.
- **Rest timer** — a countdown that starts after a set; default duration is configurable.
- **Routines** — group exercises into named workouts and run a session as a checklist.
- **Units** — global kg/lb default, stored per set so history never gets rewritten.
- **Backup** — export all data as JSON or CSV via the share sheet.

All data is stored on-device in SQLite (offline, private). The data layer sits behind
a repository module (`db/repo.ts`) so cloud sync can be added later without a rewrite.

## Getting started

```bash
npm install
npx expo start   # scan the QR code with Expo Go on your phone
```

Other useful scripts:

```bash
npm run typecheck   # tsc --noEmit
npx expo export --platform ios   # headless bundle check
```

## Project structure

```
app/                 expo-router screens
  (tabs)/            Exercises / Routines / Settings tabs
  exercise/[id]/     detail (history + progress) and the day editor
  routine/[id]/      routine detail and the run-session flow
db/                  SQLite init + migrations and the typed repository
lib/                 domain types, unit conversion, PR/metrics logic
store/               zustand stores (settings, rest timer)
components/          shared UI kit, progress chart, rest-timer bar
theme/               design tokens
```

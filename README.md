# Lumen

A life simulation where the simulation is your actual life.

You log the real things you do — an hour of study, a glass of water, a page of
Qur'an, a walk, a night's sleep — and they move a character that is genuinely
you. Nine attributes, an XP curve, quests, achievements, collections, masteries,
long missions, a progress map. Everything a role-playing game gives you for
killing imaginary monsters, pointed instead at the life you are already living.

Runs entirely in the browser. No account, no server, no network calls. Your save
file lives in `localStorage` and can be exported to JSON at any time.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production bundle into dist/
```

## Installing it as an app

Lumen is a progressive web app: served over HTTPS it installs to a phone's home
screen with its own icon, opens fullscreen with no browser chrome, and keeps
working with no signal. `Workshop → Install Lumen` triggers the prompt when the
browser is offering one.

Offline support comes from a service worker generated at build time by a plugin
in `vite.config.ts`, which fills in the placeholders in `sw.template.js`. The
precache list *has* to be generated, because Vite fingerprints asset filenames —
a hand-written list would cache nothing on the very first visit, which is the one
visit that matters. Navigation is network-first, so a new deploy lands on the
next launch; assets are cache-first, since content-addressed names make a cached
hit always correct.

`npm run dev` never registers the worker, so local development is never served
from a stale cache.

Any static host works. `base` comes from `PAGES_BASE` for hosts that serve from
a subdirectory, and defaults to `/`. `public/_redirects` is Cloudflare Pages'
SPA fallback and is ignored elsewhere.

---

## The one idea

Every system in this app reads from a single source of truth, so a single
logged action visibly moves all of them at once.

Log one glass of water and you will watch it, in one cascade:

- award XP toward your level and rank
- raise **Health**, which raises your Energy ceiling tomorrow morning
- restore **Energy** and **Clarity** right now
- advance every quest that cares about water — daily, weekly and monthly
- extend your streak, and your water ritual's own streak
- move the *Wellspring* mission
- climb the water mastery ladder, which permanently raises what water is worth
- possibly unlock an achievement, a collection card or a title

That is not a metaphor for how the app is organised — it is literally one
function call, and the UI shows you the whole chain before you commit to it.

## How it works

The save file contains only **facts**: an append-only log of what you did, and
an append-only ledger of what you were rewarded. Nothing else is stored.

Levels, attributes, vitals, streaks, quest progress, scores, achievements,
masteries and mission stages are all *derived* from those two lists by
`deriveWorld()`. Two systems physically cannot disagree with each other, because
there is only one state and every screen is a different view of it. Your total
XP is exactly the sum of the log plus the ledger — the Chronicle tab in the
Almanac shows every point you have ever earned and what earned it.

```
src/engine/
  types.ts          the domain model
  util.ts           dates, seeded RNG, formatting
  content/
    attributes.ts   the nine attributes, seven categories, three vitals
    actions.ts      ~36 real-life actions and what each one costs and gives
    achievements.ts 67 achievements, all of them `metric >= target`
    collections.ts  five collections of cards to fill in
    missions.ts     eight long multi-stage arcs, eight opt-in challenges
    titles.ts       titles, cosmetics, seasons
  progression.ts    XP curves, ranks, mastery ladders, bonus multipliers
  quests.ts         quest generation (frozen per period) and evaluation
  derive.ts         SaveState -> World. Everything the UI reads.
  engine.ts         logAction() and reconcile(). The only two verbs.
  recommend.ts      the morning brief and evening review
  persistence.ts    localStorage, migrations, import/export
```

`reconcile()` is the heartbeat: it draws quest boards for the current day, week
and month, pays out anything earned since it last ran, and closes out finished
challenges. It is idempotent and safe to call as often as you like.

### Screens

| | |
|---|---|
| **Today** | The whole world state on one page — character, vitals, today's quests, what would move the most right now, ritual checklist, the day's record |
| **Quests** | Daily, weekly and monthly boards, eight long missions, opt-in challenges |
| **Character** | Nine attributes with what each one governs, titles, ranks, rituals, mastery ladders |
| **Almanac** | Achievements, collections, and the Chronicle of every reward ever paid |
| **Atlas** | The progress map, a heatmap of every day, and the honest statistics |
| **Workshop** | Sparks, grace days, themes, sigils, settings, export/import |

Press `L` to log from anywhere; `1`–`6` switch screens.

## The design rules

A few decisions the code is built around. If you extend this, keep them.

**Nothing shames you.** There is no red, no guilt, no penalty for a missed day.
Streaks carry built-in grace days that forgive misses automatically. Coming back
after a gap is itself an achievement ("Return"), and deliberately one of the
warmer ones. Challenges you don't finish are recorded as attempts, not failures.
`recommend.ts` carries a hard rule in its header: a missed ritual is described as
*available*, never as *failed*.

**Effort is never wasted, but grinding is never rewarded.** Every action has a
soft cap; past it, extra effort still counts, just gently less (`softCapped()`).
The fifth hour of study in a day is worth about a third of the first. The app
would rather you did something else with the hour, and says so.

**The numbers are an opinion about how to live.** Reviewing pays better per
minute than studying. Teaching pays best of all. Sleep is the single
highest-leverage action in the catalogue and is labelled as such. Harmony rewards
a wide life over an obsessive one. These are choices, not balance accidents.

**Rewards buy nothing that makes you stronger.** Sparks buy themes, sigils and
grace days. There is no way to purchase progress, and no timer anywhere that
punishes you for closing the tab.

**Nothing is a mystery box.** Every locked achievement shows its real metric and
its real target. The log sheet shows the exact XP, attribute gain, vital change
and quest movement *before* you commit — computed by the same code path that
awards it, so the preview cannot lie.

## Data

Everything is local. `Workshop → Export` writes a JSON file you can keep or move
to another browser; `Import` reads it back; `Start over` erases the save.

New installs are offered ten weeks of clearly-labelled example history so the app
can be explored with a lived-in world. Choosing "start empty" is the honest path,
and everything earned from there is real.

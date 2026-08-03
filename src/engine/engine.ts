/**
 * The engine.
 *
 * There is exactly one verb in this game — `logAction` — and one heartbeat —
 * `reconcile`. Everything the player experiences as "the app noticed" happens
 * in reconcile: quests resolving, achievements unlocking, missions advancing,
 * challenges closing, the next day's board being drawn.
 *
 * Both return the events they caused, which is how the UI knows what to
 * celebrate and in what order.
 */

import { ACHIEVEMENTS, TIER_COLOR, TIER_REWARD } from './content/achievements';
import { ACTIONS, DEFAULT_RITUALS } from './content/actions';
import { ATTRIBUTES, ATTRIBUTE_IDS, VITALS } from './content/attributes';
import { ALL_CARDS, COLLECTION_OF_CARD } from './content/collections';
import { CHALLENGES_BY_ID, MISSIONS } from './content/missions';
import { TITLES } from './content/titles';
import { deriveWorld, type World } from './derive';
import { harmonyMultiplier, isMajorLevel, masteryFor, vitalMultiplier } from './progression';
import { evaluateRequirement, generateBoard, periodKeyFor, type GenContext } from './quests';
import type {
  AttributeId,
  GameEvent,
  LedgerEntry,
  LogEntry,
  QuestReward,
  QuestScope,
  SaveState,
  VitalId,
} from './types';
import { addDays, clamp, daysBetween, rangeKeys, round, softCapped, todayKey, uid } from './util';

export const SAVE_VERSION = 1;

/* --------------------------------------------------------------- new game */

export function createSave(name = 'Traveller'): SaveState {
  return {
    version: SAVE_VERSION,
    createdAt: Date.now(),
    seed: Math.floor(Math.random() * 2 ** 31),
    profile: { name, sigil: '🌱', activeTitle: null, theme: 'theme_default' },
    log: [],
    rituals: [...DEFAULT_RITUALS],
    questBoard: { daily: null, weekly: null, monthly: null },
    claimedQuests: {},
    unlocked: { achievements: {}, cards: {}, titles: {}, cosmetics: ['theme_default', 'sigil_seed'] },
    missionStages: {},
    challenges: [],
    ledger: [],
    sparksSpent: 0,
    purchasedShields: 0,
    seen: { lastMorningBrief: null, lastEveningReview: null, onboarded: false },
    settings: { reducedMotion: false, dayStartHour: 4, eveningHour: 20 },
  };
}

/* ------------------------------------------------------------- ledger ops */

function ledgerEntry(
  source: LedgerEntry['source'],
  refId: string,
  label: string,
  emoji: string,
  reward: QuestReward,
  date: string,
  at: number,
): LedgerEntry {
  return {
    id: uid('led'),
    at,
    date,
    source,
    refId,
    label,
    emoji,
    xp: reward.xp,
    sparks: reward.sparks,
    attribute: reward.attribute,
    attributeXp: reward.attributeXp,
  };
}

function rewardDetail(reward: QuestReward): string {
  const bits = [`+${reward.xp} XP`];
  if (reward.sparks) bits.push(`+${reward.sparks} ✦`);
  if (reward.attribute && reward.attributeXp) {
    bits.push(`+${reward.attributeXp} ${ATTRIBUTES[reward.attribute].name}`);
  }
  return bits.join(' · ');
}

/* ---------------------------------------------------------- quest context */

function genContext(world: World): GenContext {
  const typical: Record<string, number> = {};
  for (const stat of world.actionList) typical[stat.def.id] = round(stat.typicalPerDay, 1);

  const quiet = [...world.attributeList]
    .sort((a, b) => a.weekXp - b.weekXp || a.xp - b.xp)
    .map((a) => a.def.id);

  const rituals = world.save.rituals.length ? world.save.rituals : DEFAULT_RITUALS;
  const atRisk = rituals.filter(
    (r) => (world.actions[r]?.streak ?? 0) >= 2 && (world.actions[r]?.todayUnits ?? 0) === 0,
  );

  return { level: world.level.level, quietAttributes: quiet, typical, rituals, atRisk };
}

/* ------------------------------------------------------------- reconcile */

/**
 * Brings the save file up to date with the world it describes: draws any quest
 * board that is missing or stale, pays out anything that has been earned since
 * last time, and closes out finished challenges.
 *
 * Safe to call as often as you like — everything it does is idempotent.
 */
export function reconcile(input: SaveState, now: Date = new Date()): { save: SaveState; events: GameEvent[] } {
  let save: SaveState = { ...input };
  const events: GameEvent[] = [];
  const at = now.getTime();
  const today = todayKey(save.settings.dayStartHour, now);

  /* --- quest boards --------------------------------------------------- */
  let world = deriveWorld(save, now);
  const board = { ...save.questBoard };
  let boardChanged = false;
  for (const scope of ['daily', 'weekly', 'monthly'] as QuestScope[]) {
    const wanted = periodKeyFor(scope, today);
    if (!board[scope] || board[scope]!.periodKey !== wanted) {
      board[scope] = generateBoard(scope, today, save.seed, genContext(world));
      boardChanged = true;
    }
  }
  if (boardChanged) {
    save = { ...save, questBoard: board };
    world = deriveWorld(save, now);
  }

  /* --- payouts, looped until nothing new fires ------------------------ */
  for (let pass = 0; pass < 6; pass++) {
    const newLedger: LedgerEntry[] = [];
    const claimed = { ...save.claimedQuests };
    const achievements = { ...save.unlocked.achievements };
    const cards = { ...save.unlocked.cards };
    const titles = { ...save.unlocked.titles };
    const missionStages = { ...save.missionStages };
    let challenges = save.challenges;
    let fired = false;

    // Quests -----------------------------------------------------------
    for (const q of world.allQuests) {
      if (!q.complete || claimed[q.id]) continue;
      claimed[q.id] = today;
      newLedger.push(ledgerEntry('quest', q.id, q.title, q.emoji, q.reward, today, at));
      events.push({
        id: uid('ev'),
        kind: 'quest_complete',
        title: q.title,
        detail: rewardDetail(q.reward),
        emoji: q.emoji,
        weight: q.scope === 'daily' ? 2 : 3,
        color: '#ffd479',
      });
      fired = true;
    }

    // Achievements ------------------------------------------------------
    for (const a of ACHIEVEMENTS) {
      if (achievements[a.id]) continue;
      if (world.metric(a.metric) < a.target) continue;
      achievements[a.id] = today;
      const reward = TIER_REWARD[a.tier];
      newLedger.push(ledgerEntry('achievement', a.id, a.name, a.emoji, { ...reward }, today, at));
      events.push({
        id: uid('ev'),
        kind: 'achievement',
        title: a.name,
        detail: a.blurb,
        emoji: a.emoji,
        weight: a.tier >= 3 ? 3 : 2,
        color: TIER_COLOR[a.tier],
      });
      fired = true;
    }

    // Collection cards --------------------------------------------------
    for (const c of ALL_CARDS) {
      if (cards[c.id]) continue;
      if (world.metric(c.metric) < c.target) continue;
      cards[c.id] = today;
      const reward = { xp: 25 * c.tier, sparks: 2 * c.tier };
      newLedger.push(ledgerEntry('card', c.id, c.name, c.emoji, reward, today, at));
      events.push({
        id: uid('ev'),
        kind: 'card',
        title: `${c.name} found`,
        detail: `${COLLECTION_OF_CARD[c.id]?.name ?? 'Collection'} · ${c.blurb}`,
        emoji: c.emoji,
        weight: 2,
        color: COLLECTION_OF_CARD[c.id]?.color,
      });
      fired = true;
    }

    // Titles ------------------------------------------------------------
    for (const t of TITLES) {
      if (titles[t.id]) continue;
      if (world.metric(t.metric) < t.target) continue;
      titles[t.id] = today;
      events.push({
        id: uid('ev'),
        kind: 'title',
        title: `Title earned: ${t.name}`,
        detail: t.blurb,
        emoji: '🏷️',
        weight: 2,
        color: '#ffd479',
      });
      fired = true;
    }

    // Missions ----------------------------------------------------------
    for (const m of MISSIONS) {
      const done = missionStages[m.id] ?? 0;
      if (done >= m.stages.length) continue;
      const value = world.metric(m.metric);
      let stage = done;
      while (stage < m.stages.length && value >= m.stages[stage].target) {
        const s = m.stages[stage];
        newLedger.push(ledgerEntry('mission', `${m.id}:${stage}`, `${m.name} — ${s.name}`, m.emoji, s.reward, today, at));
        events.push({
          id: uid('ev'),
          kind: 'mission',
          title: `${m.name}`,
          detail: `${s.name} reached · ${rewardDetail(s.reward)}`,
          emoji: m.emoji,
          weight: 3,
          color: m.color,
        });
        stage++;
        fired = true;
      }
      if (stage !== done) missionStages[m.id] = stage;
    }

    // Challenges --------------------------------------------------------
    const resolvedRuns = challenges.map((run) => {
      if (run.resolved) return run;
      const def = CHALLENGES_BY_ID[run.challengeId];
      if (!def) return { ...run, resolved: 'ended' as const };
      const lastDay = addDays(run.startDate, def.days - 1);
      const days = rangeKeys(run.startDate, lastDay);
      const met = days.filter((d) => {
        const entries = world.entriesByDate[d] ?? [];
        const ctx = { entriesByDate: world.entriesByDate, dayKeys: [d], rituals: save.rituals };
        return evaluateRequirement(def.daily, entries, ctx) >= def.daily.target;
      }).length;

      if (met >= def.requiredDays) {
        newLedger.push(ledgerEntry('challenge', run.id, def.name, def.emoji, def.reward, today, at));
        events.push({
          id: uid('ev'),
          kind: 'challenge',
          title: `${def.name} complete`,
          detail: rewardDetail(def.reward),
          emoji: def.badge,
          weight: 3,
          color: '#ffd479',
        });
        fired = true;
        return { ...run, resolved: 'complete' as const };
      }
      const remaining = daysBetween(today, lastDay);
      if (remaining < 0) {
        events.push({
          id: uid('ev'),
          kind: 'challenge',
          title: `${def.name} has finished`,
          detail: `${met} of ${def.requiredDays} days. The attempt is kept — nothing is lost.`,
          emoji: def.emoji,
          weight: 1,
        });
        fired = true;
        return { ...run, resolved: 'ended' as const };
      }
      return run;
    });
    if (resolvedRuns.some((r, i) => r !== challenges[i])) challenges = resolvedRuns;

    if (!fired) break;

    save = {
      ...save,
      ledger: [...save.ledger, ...newLedger],
      claimedQuests: claimed,
      unlocked: { ...save.unlocked, achievements, cards, titles },
      missionStages,
      challenges,
    };
    world = deriveWorld(save, now);
  }

  return { save, events };
}

/* ------------------------------------------------------------ the verb */

export interface LogResult {
  save: SaveState;
  events: GameEvent[];
  entry: LogEntry;
}

/**
 * Log one real-life action and let it ripple.
 *
 * The XP calculation is intentionally legible: base value × how much of it
 * lands after the soft cap × how well-resourced you are × what you have
 * mastered × how wide your week has been.
 */
export function logAction(
  save: SaveState,
  actionId: string,
  amount: number,
  opts: { note?: string; now?: Date; date?: string } = {},
): LogResult {
  const now = opts.now ?? new Date();
  const def = ACTIONS[actionId];
  if (!def) throw new Error(`Unknown action: ${actionId}`);

  const before = deriveWorld(save, now);
  const date = opts.date ?? before.today;
  const stat = before.actions[actionId];

  // Diminishing returns apply to the day's running total, not the single entry,
  // so five short sessions and one long one are treated the same way.
  const already = date === before.today ? stat.todayUnits : sumUnitsOn(before, actionId, date);
  const effective = Math.max(
    0,
    softCapped(already + amount, def.softCap) - softCapped(already, def.softCap),
  );

  const vitalValue = before.vitals[def.keyVital];
  const vitalBonus = vitalMultiplier(vitalValue);
  const masteryBonus = stat.mastery.bonus;
  const liveAttributes = before.attributeList.filter((a) => a.weekXp > 0).length;
  const harmonyBonus = harmonyMultiplier(liveAttributes);
  const multiplier = vitalBonus * masteryBonus * harmonyBonus;

  const attributeXp: Partial<Record<AttributeId, number>> = {};
  for (const [k, v] of Object.entries(def.attributes)) {
    attributeXp[k as AttributeId] = round((v ?? 0) * effective * multiplier, 2);
  }

  const entry: LogEntry = {
    id: uid('log'),
    actionId,
    date,
    at: now.getTime(),
    amount,
    note: opts.note?.trim() || undefined,
    xp: Math.max(1, Math.round(def.xpPerUnit * effective * multiplier)),
    attributeXp,
    bonuses: { vital: round(vitalBonus, 3), mastery: round(masteryBonus, 3), harmony: round(harmonyBonus, 3) },
  };

  const withEntry: SaveState = { ...save, log: [...save.log, entry] };
  const after = deriveWorld(withEntry, now);

  const events = diffEvents(before, after, entry, def.keyVital);
  const settled = reconcile(withEntry, now);

  return { save: settled.save, events: [...events, ...settled.events], entry };
}

export interface ActionPreview {
  xp: number;
  attributeXp: Partial<Record<AttributeId, number>>;
  vitals: Partial<Record<VitalId, number>>;
  bonuses: { vital: number; mastery: number; harmony: number; total: number };
  /** Quests this would move, so the ripple is visible *before* committing. */
  questsTouched: { id: string; title: string; emoji: string; from: number; to: number; target: number }[];
  masteryNext: { name: string; remaining: number } | null;
  softCapped: boolean;
}

/**
 * What would happen if you logged this — computed with the same code path as
 * the real thing, so the preview can never lie about the reward.
 */
export function previewAction(save: SaveState, actionId: string, amount: number, now = new Date()): ActionPreview {
  const def = ACTIONS[actionId];
  const before = deriveWorld(save, now);
  const stat = before.actions[actionId];

  const already = stat.todayUnits;
  const effective = Math.max(0, softCapped(already + amount, def.softCap) - softCapped(already, def.softCap));

  const vitalBonus = vitalMultiplier(before.vitals[def.keyVital]);
  const masteryBonus = stat.mastery.bonus;
  const harmonyBonus = harmonyMultiplier(before.attributeList.filter((a) => a.weekXp > 0).length);
  const multiplier = vitalBonus * masteryBonus * harmonyBonus;

  const attributeXp: Partial<Record<AttributeId, number>> = {};
  for (const [k, v] of Object.entries(def.attributes)) {
    attributeXp[k as AttributeId] = round((v ?? 0) * effective * multiplier, 1);
  }

  const vitals: Partial<Record<VitalId, number>> = {};
  for (const [k, v] of Object.entries(def.vitals)) {
    const key = k as VitalId;
    const next = clamp(before.vitals[key] + (v ?? 0) * amount, 0, 100);
    const delta = round(next - before.vitals[key], 0);
    if (Math.abs(delta) >= 1) vitals[key] = delta;
  }

  const probe: LogEntry = {
    id: 'probe',
    actionId,
    date: before.today,
    at: now.getTime(),
    amount,
    xp: Math.round(def.xpPerUnit * effective * multiplier),
    attributeXp,
    bonuses: { vital: vitalBonus, mastery: masteryBonus, harmony: harmonyBonus },
  };

  const questsTouched = before.allQuests
    .filter((q) => !q.complete)
    .map((q) => {
      const to = evaluateRequirement(q.requirement, [...windowEntriesFor(before, q.scope), probe], {
        entriesByDate: before.entriesByDate,
        dayKeys: [before.today],
        rituals: save.rituals,
      });
      return { id: q.id, title: q.title, emoji: q.emoji, from: q.current, to, target: q.requirement.target };
    })
    .filter((q) => q.to > q.from);

  const mastery = stat.mastery;

  return {
    xp: Math.max(1, Math.round(def.xpPerUnit * effective * multiplier)),
    attributeXp,
    vitals,
    bonuses: {
      vital: round(vitalBonus, 2),
      mastery: round(masteryBonus, 2),
      harmony: round(harmonyBonus, 2),
      total: round(multiplier, 2),
    },
    questsTouched,
    masteryNext: mastery.next === null ? null : { name: mastery.name, remaining: round(mastery.next - mastery.units, 1) },
    softCapped: already + amount > def.softCap,
  };
}

function windowEntriesFor(world: World, scope: QuestScope): LogEntry[] {
  if (scope === 'daily') return world.entriesByDate[world.today] ?? [];
  const period = world.save.questBoard[scope];
  if (!period) return [];
  const start = scope === 'weekly' ? period.periodKey : `${period.periodKey}-01`;
  return rangeKeys(start, world.today).flatMap((d) => world.entriesByDate[d] ?? []);
}

function sumUnitsOn(world: World, actionId: string, date: string): number {
  return (world.entriesByDate[date] ?? [])
    .filter((e) => e.actionId === actionId)
    .reduce((t, e) => t + e.amount, 0);
}

/**
 * The cascade. This is the function that makes one logged glass of water
 * visibly touch seven different systems.
 */
function diffEvents(before: World, after: World, entry: LogEntry, keyVital: VitalId): GameEvent[] {
  const out: GameEvent[] = [];
  const def = ACTIONS[entry.actionId];

  out.push({
    id: uid('ev'),
    kind: 'xp',
    title: `+${entry.xp} XP`,
    detail: def.name,
    emoji: def.emoji,
    weight: 1,
  });

  for (const id of ATTRIBUTE_IDS) {
    const gain = entry.attributeXp[id] ?? 0;
    if (gain < 0.5) continue;
    out.push({
      id: uid('ev'),
      kind: 'attribute',
      title: `+${round(gain, 1)} ${ATTRIBUTES[id].name}`,
      emoji: ATTRIBUTES[id].emoji,
      color: ATTRIBUTES[id].color,
      weight: 1,
    });
    const b = before.attributes[id].level.level;
    const a = after.attributes[id].level.level;
    if (a > b) {
      out.push({
        id: uid('ev'),
        kind: 'attribute_level',
        title: `${ATTRIBUTES[id].name} ${a}`,
        detail: ATTRIBUTES[id].governs,
        emoji: ATTRIBUTES[id].emoji,
        color: ATTRIBUTES[id].color,
        weight: 2,
      });
    }
  }

  if (after.level.level > before.level.level) {
    const major = isMajorLevel(after.level.level);
    out.push({
      id: uid('ev'),
      kind: 'level',
      title: `Level ${after.level.level}`,
      detail: after.rank.name !== before.rank.name ? `You are now ${after.rank.name} — ${after.rank.blurb}` : undefined,
      emoji: '✦',
      weight: major || after.rank.name !== before.rank.name ? 3 : 2,
      color: after.rank.color,
    });
  }

  const vitalDelta = after.vitals[keyVital] - before.vitals[keyVital];
  if (Math.abs(vitalDelta) >= 1) {
    const v = VITALS[keyVital];
    out.push({
      id: uid('ev'),
      kind: 'vital',
      title: `${vitalDelta > 0 ? '+' : ''}${Math.round(vitalDelta)} ${v.name}`,
      emoji: v.emoji,
      color: v.color,
      weight: 1,
    });
  }

  const beforeMastery = masteryFor(def, before.actions[def.id].units);
  const afterMastery = after.actions[def.id].mastery;
  if (afterMastery.tier > beforeMastery.tier) {
    out.push({
      id: uid('ev'),
      kind: 'mastery',
      title: `${def.name}: ${afterMastery.name}`,
      detail: `Mastery ${afterMastery.tier} · all future ${def.name.toLowerCase()} is worth ${Math.round((afterMastery.bonus - 1) * 100)}% more`,
      emoji: def.emoji,
      weight: 3,
      color: '#ffd479',
    });
  }

  if (after.streak.current > before.streak.current) {
    out.push({
      id: uid('ev'),
      kind: 'streak',
      title: `${after.streak.current} day${after.streak.current === 1 ? '' : 's'} in a row`,
      detail: after.streak.current === after.streak.best ? 'Your longest yet.' : undefined,
      emoji: '🔥',
      weight: after.streak.current % 7 === 0 ? 3 : 1,
      color: '#ff8a6b',
    });
  }

  // Quest movement — shown as progress, not as pressure.
  for (const q of after.allQuests) {
    const prev = before.allQuests.find((p) => p.id === q.id);
    if (!prev || q.current <= prev.current || q.complete) continue;
    out.push({
      id: uid('ev'),
      kind: 'quest_progress',
      title: q.title,
      detail: `${round(q.current, 1)} / ${q.requirement.target}`,
      emoji: q.emoji,
      weight: 1,
      color: '#9fb3d1',
    });
  }

  return out;
}

/* ------------------------------------------------------------- mutations */

export function undoEntry(save: SaveState, entryId: string): SaveState {
  return { ...save, log: save.log.filter((e) => e.id !== entryId) };
}

export function setRituals(save: SaveState, rituals: string[]): SaveState {
  return { ...save, rituals: rituals.slice(0, 8) };
}

export function startChallenge(save: SaveState, challengeId: string, today: string): SaveState {
  const active = save.challenges.some((c) => !c.resolved && c.challengeId === challengeId);
  if (active) return save;
  return {
    ...save,
    challenges: [...save.challenges, { id: uid('run'), challengeId, startDate: today }],
  };
}

export function abandonChallenge(save: SaveState, runId: string): SaveState {
  return {
    ...save,
    challenges: save.challenges.map((c) => (c.id === runId ? { ...c, resolved: 'ended' as const } : c)),
  };
}

export function purchase(save: SaveState, cosmeticId: string, cost: number, balance: number): SaveState {
  if (balance < cost || save.unlocked.cosmetics.includes(cosmeticId)) return save;
  return {
    ...save,
    sparksSpent: save.sparksSpent + cost,
    unlocked: { ...save.unlocked, cosmetics: [...save.unlocked.cosmetics, cosmeticId] },
  };
}

export function buyShield(save: SaveState, cost: number, balance: number): SaveState {
  if (balance < cost) return save;
  return { ...save, sparksSpent: save.sparksSpent + cost, purchasedShields: save.purchasedShields + 1 };
}

export function equip(save: SaveState, kind: 'theme' | 'sigil', id: string, glyph?: string): SaveState {
  if (kind === 'theme') return { ...save, profile: { ...save.profile, theme: id } };
  return { ...save, profile: { ...save.profile, sigil: glyph ?? save.profile.sigil } };
}

export function setTitle(save: SaveState, titleId: string | null): SaveState {
  return { ...save, profile: { ...save.profile, activeTitle: titleId } };
}

export function setName(save: SaveState, name: string): SaveState {
  return { ...save, profile: { ...save.profile, name: name.slice(0, 24) || 'Traveller' } };
}

export function markSeen(save: SaveState, key: 'lastMorningBrief' | 'lastEveningReview', day: string): SaveState {
  return { ...save, seen: { ...save.seen, [key]: day } };
}

export function finishOnboarding(save: SaveState): SaveState {
  return { ...save, seen: { ...save.seen, onboarded: true } };
}

export function updateSettings(save: SaveState, patch: Partial<SaveState['settings']>): SaveState {
  return { ...save, settings: { ...save.settings, ...patch } };
}

/** Estimated XP if the player did everything today's board is asking for. */
export function projectedDailyXp(world: World): number {
  const questXp = world.quests.daily.filter((q) => !q.complete).reduce((t, q) => t + q.reward.xp, 0);
  const recent = world.days.slice(-14).filter((d) => d.xp > 0);
  const typical = recent.length ? recent.reduce((t, d) => t + d.xp, 0) / recent.length : 160;
  const remaining = Math.max(0, typical - world.todaySummary.xp);
  return Math.round(questXp + remaining);
}

/** A single blended number for "how is life going", used by the dashboard ring. */
export function lifeScore(world: World): number {
  const { wellness, harmony, momentum, completion } = world.scores;
  const attrAvg =
    world.attributeList.reduce((t, a) => t + clamp(a.level.level / 20, 0, 1), 0) / world.attributeList.length;
  return Math.round(clamp(wellness * 0.25 + harmony * 0.2 + momentum * 0.25 + completion * 0.15 + attrAvg * 100 * 0.15, 0, 100));
}

import type { ChallengeDef, MissionDef } from '../types';

/**
 * Missions are the multi-month arcs — the things you are actually doing with
 * your life, expressed as stages rather than a single distant number.
 */
export const MISSIONS: MissionDef[] = [
  {
    id: 'scholars_road',
    name: 'The Scholar’s Road',
    blurb: 'Hours in the chair. There is no shortcut and there never was.',
    emoji: '📘',
    color: '#7aa2ff',
    metric: 'units:study',
    stages: [
      { name: 'Ten hours', target: 600, reward: { xp: 200, sparks: 20, attribute: 'knowledge', attributeXp: 60 } },
      { name: 'Fifty hours', target: 3000, reward: { xp: 600, sparks: 60, attribute: 'knowledge', attributeXp: 180 } },
      { name: 'A hundred and fifty hours', target: 9000, reward: { xp: 1500, sparks: 150, attribute: 'knowledge', attributeXp: 400 } },
      { name: 'Five hundred hours', target: 30000, reward: { xp: 4000, sparks: 400, attribute: 'knowledge', attributeXp: 1200 } },
    ],
  },
  {
    id: 'the_book',
    name: 'Guardian of the Book',
    blurb: 'Page by page, at whatever pace is honest.',
    emoji: '🕌',
    color: '#ffd479',
    metric: 'units:quran',
    stages: [
      { name: 'First hundred pages', target: 100, reward: { xp: 250, sparks: 25, attribute: 'spirituality', attributeXp: 80 } },
      { name: 'A complete reading', target: 604, reward: { xp: 1200, sparks: 120, attribute: 'spirituality', attributeXp: 350 } },
      { name: 'A second reading', target: 1208, reward: { xp: 2000, sparks: 200, attribute: 'spirituality', attributeXp: 600 } },
      { name: 'Five readings', target: 3020, reward: { xp: 5000, sparks: 500, attribute: 'spirituality', attributeXp: 1500 } },
    ],
  },
  {
    id: 'unbroken',
    name: 'The Unbroken',
    blurb: 'Not the longest day — the longest thread.',
    emoji: '🧵',
    color: '#ff8a6b',
    metric: 'best_streak',
    stages: [
      { name: 'Seven days', target: 7, reward: { xp: 150, sparks: 15, attribute: 'discipline', attributeXp: 50 } },
      { name: 'Thirty days', target: 30, reward: { xp: 600, sparks: 60, attribute: 'discipline', attributeXp: 200 } },
      { name: 'A hundred days', target: 100, reward: { xp: 2000, sparks: 200, attribute: 'discipline', attributeXp: 600 } },
      { name: 'A year', target: 365, reward: { xp: 8000, sparks: 800, attribute: 'discipline', attributeXp: 2000 } },
    ],
  },
  {
    id: 'strong_body',
    name: 'A Body That Carries You',
    blurb: 'Movement banked against the decades ahead.',
    emoji: '💪',
    color: '#ff8a6b',
    metric: 'tag:movement',
    stages: [
      { name: 'Ten hours moving', target: 600, reward: { xp: 200, sparks: 20, attribute: 'fitness', attributeXp: 70 } },
      { name: 'Fifty hours', target: 3000, reward: { xp: 700, sparks: 70, attribute: 'fitness', attributeXp: 220 } },
      { name: 'Two hundred hours', target: 12000, reward: { xp: 2500, sparks: 250, attribute: 'fitness', attributeXp: 700 } },
    ],
  },
  {
    id: 'wellspring',
    name: 'Wellspring',
    blurb: 'The least glamorous mission on this list. Also the most reliable.',
    emoji: '💧',
    color: '#4fd1a5',
    metric: 'units:water',
    stages: [
      { name: 'A hundred glasses', target: 100, reward: { xp: 120, sparks: 12, attribute: 'health', attributeXp: 40 } },
      { name: 'Five hundred', target: 500, reward: { xp: 400, sparks: 40, attribute: 'health', attributeXp: 130 } },
      { name: 'Two thousand', target: 2000, reward: { xp: 1600, sparks: 160, attribute: 'health', attributeXp: 500 } },
    ],
  },
  {
    id: 'the_maker',
    name: 'The Maker',
    blurb: 'Things that exist because you sat down and made them.',
    emoji: '🛠️',
    color: '#ff9ecb',
    metric: 'cat:craft',
    stages: [
      { name: 'Ten hours making', target: 600, reward: { xp: 200, sparks: 20, attribute: 'creativity', attributeXp: 70 } },
      { name: 'Fifty hours', target: 3000, reward: { xp: 700, sparks: 70, attribute: 'creativity', attributeXp: 220 } },
      { name: 'Two hundred hours', target: 12000, reward: { xp: 2500, sparks: 250, attribute: 'creativity', attributeXp: 700 } },
    ],
  },
  {
    id: 'kept_ties',
    name: 'Kept Ties',
    blurb: 'The people who will be there in thirty years, tended now.',
    emoji: '🤝',
    color: '#ffb86b',
    metric: 'cat:bonds',
    stages: [
      { name: 'Ten hours given', target: 600, reward: { xp: 200, sparks: 20, attribute: 'relationships', attributeXp: 70 } },
      { name: 'Fifty hours', target: 3000, reward: { xp: 700, sparks: 70, attribute: 'relationships', attributeXp: 220 } },
      { name: 'Two hundred hours', target: 12000, reward: { xp: 2500, sparks: 250, attribute: 'relationships', attributeXp: 700 } },
    ],
  },
  {
    id: 'whole_person',
    name: 'The Whole Person',
    blurb: 'Every attribute, carried up together. The hardest mission here.',
    emoji: '⚖️',
    color: '#b98bff',
    metric: 'min_attribute',
    stages: [
      { name: 'Nothing below 5', target: 5, reward: { xp: 500, sparks: 50 } },
      { name: 'Nothing below 10', target: 10, reward: { xp: 1500, sparks: 150 } },
      { name: 'Nothing below 20', target: 20, reward: { xp: 5000, sparks: 500 } },
    ],
  },
];

export const MISSIONS_BY_ID: Record<string, MissionDef> = Object.fromEntries(MISSIONS.map((m) => [m.id, m]));

/**
 * Challenges are opt-in and time-boxed. Failing one costs nothing at all —
 * the run simply ends and the attempt is remembered. That is deliberate.
 */
export const CHALLENGES: ChallengeDef[] = [
  {
    id: 'deep_focus_week',
    name: 'Deep Focus Week',
    blurb: 'An hour of real study on six of the next seven days.',
    emoji: '🎯',
    days: 7,
    daily: { kind: 'action_units', target: 60, actionId: 'study' },
    requiredDays: 6,
    reward: { xp: 700, sparks: 70, attribute: 'focus', attributeXp: 200 },
    badge: '🎯',
  },
  {
    id: 'hydration_sprint',
    name: 'Hydration Sprint',
    blurb: 'Six glasses a day, five days running.',
    emoji: '💧',
    days: 5,
    daily: { kind: 'action_units', target: 6, actionId: 'water' },
    requiredDays: 5,
    reward: { xp: 300, sparks: 30, attribute: 'health', attributeXp: 90 },
    badge: '💧',
  },
  {
    id: 'dawn_rising',
    name: 'Dawn Rising',
    blurb: 'Wake early on six of seven days.',
    emoji: '🌅',
    days: 7,
    daily: { kind: 'action_units', target: 1, actionId: 'early_rise' },
    requiredDays: 6,
    reward: { xp: 600, sparks: 60, attribute: 'discipline', attributeXp: 180 },
    badge: '🌅',
  },
  {
    id: 'screen_fast',
    name: 'The Screen Fast',
    blurb: 'One screen-free hour a day, five days running.',
    emoji: '🌘',
    days: 5,
    daily: { kind: 'action_units', target: 1, actionId: 'screen_free' },
    requiredDays: 5,
    reward: { xp: 400, sparks: 40, attribute: 'focus', attributeXp: 120 },
    badge: '🌘',
  },
  {
    id: 'quiet_mind',
    name: 'Quiet Mind',
    blurb: 'Ten minutes of stillness on eight of the next ten days.',
    emoji: '🌌',
    days: 10,
    daily: { kind: 'action_units', target: 10, actionId: 'meditate' },
    requiredDays: 8,
    reward: { xp: 550, sparks: 55, attribute: 'focus', attributeXp: 170 },
    badge: '🌌',
  },
  {
    id: 'body_reset',
    name: 'Body Reset',
    blurb: 'Thirty minutes of movement on ten of the next fourteen days.',
    emoji: '🏃',
    days: 14,
    daily: { kind: 'tag_units', target: 30, tag: 'movement' },
    requiredDays: 10,
    reward: { xp: 900, sparks: 90, attribute: 'fitness', attributeXp: 260 },
    badge: '🏃',
  },
  {
    id: 'steady_book',
    name: 'The Steady Reading',
    blurb: 'A page of Qur’an on twenty-five of the next thirty days.',
    emoji: '🕌',
    days: 30,
    daily: { kind: 'action_units', target: 1, actionId: 'quran' },
    requiredDays: 25,
    reward: { xp: 1600, sparks: 160, attribute: 'spirituality', attributeXp: 450 },
    badge: '🕌',
  },
  {
    id: 'wide_fortnight',
    name: 'The Wide Fortnight',
    blurb: 'Four different sides of life, on ten of fourteen days.',
    emoji: '🧭',
    days: 14,
    daily: { kind: 'distinct_categories', target: 4 },
    requiredDays: 10,
    reward: { xp: 1000, sparks: 100 },
    badge: '🧭',
  },
];

export const CHALLENGES_BY_ID: Record<string, ChallengeDef> = Object.fromEntries(
  CHALLENGES.map((c) => [c.id, c]),
);

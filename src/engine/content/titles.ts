import type { CosmeticDef, SeasonDef, TitleDef } from '../types';

/** Titles sit under your name on the character sheet. Pick whichever you like. */
export const TITLES: TitleDef[] = [
  { id: 't_beginner', name: 'the Newly Arrived', blurb: 'Logged your first action.', metric: 'entries', target: 1 },
  { id: 't_steady', name: 'the Steady', blurb: 'A seven-day streak.', metric: 'best_streak', target: 7 },
  { id: 't_unbroken', name: 'the Unbroken', blurb: 'A thirty-day streak.', metric: 'best_streak', target: 30 },
  { id: 't_constant', name: 'the Constant', blurb: 'A hundred-day streak.', metric: 'best_streak', target: 100 },
  { id: 't_scholar', name: 'the Scholar', blurb: 'Knowledge level 12.', metric: 'attr:knowledge', target: 12 },
  { id: 't_learned', name: 'the Learned', blurb: 'Knowledge level 25.', metric: 'attr:knowledge', target: 25 },
  { id: 't_devout', name: 'the Devout', blurb: 'Spirituality level 12.', metric: 'attr:spirituality', target: 12 },
  { id: 't_reciter', name: 'the Reciter', blurb: 'A complete reading of the Qur’an.', metric: 'units:quran', target: 604 },
  { id: 't_strong', name: 'the Strong', blurb: 'Fitness level 12.', metric: 'attr:fitness', target: 12 },
  { id: 't_tireless', name: 'the Tireless', blurb: 'Fitness level 22.', metric: 'attr:fitness', target: 22 },
  { id: 't_maker', name: 'the Maker', blurb: 'Creativity level 12.', metric: 'attr:creativity', target: 12 },
  { id: 't_focused', name: 'the Focused', blurb: 'Focus level 12.', metric: 'attr:focus', target: 12 },
  { id: 't_kind', name: 'the Kind', blurb: 'Twenty-five acts of kindness.', metric: 'units:kindness', target: 25 },
  { id: 't_present', name: 'the Present', blurb: 'Relationships level 12.', metric: 'attr:relationships', target: 12 },
  { id: 't_ordered', name: 'the Well-Ordered', blurb: 'Organization level 12.', metric: 'attr:organization', target: 12 },
  { id: 't_disciplined', name: 'the Disciplined', blurb: 'Discipline level 15.', metric: 'attr:discipline', target: 15 },
  { id: 't_whole', name: 'the Whole', blurb: 'No attribute below level 10.', metric: 'min_attribute', target: 10 },
  { id: 't_wayfarer', name: 'the Wayfarer', blurb: 'A hundred active days.', metric: 'active_days', target: 100 },
  { id: 't_yearlong', name: 'of the Long Year', blurb: 'Three hundred and sixty-five active days.', metric: 'active_days', target: 365 },
  { id: 't_questbearer', name: 'the Questbearer', blurb: 'A hundred quests completed.', metric: 'quests_done', target: 100 },
  { id: 't_returner', name: 'who Always Returns', blurb: 'Came back after three separate gaps.', metric: 'comebacks', target: 3 },
  { id: 't_collector', name: 'the Collector', blurb: 'Twenty collection cards found.', metric: 'cards', target: 20 },
  { id: 't_decorated', name: 'the Decorated', blurb: 'Thirty achievements.', metric: 'achievements', target: 30 },
  { id: 't_luminary', name: 'the Luminary', blurb: 'Reached level 46.', metric: 'level', target: 46 },
];

export const TITLES_BY_ID: Record<string, TitleDef> = Object.fromEntries(TITLES.map((t) => [t.id, t]));

/** Sparks buy small, permanent, entirely optional things. Nothing here is pay-to-win. */
export const COSMETICS: CosmeticDef[] = [
  { id: 'theme_default', name: 'Midnight', blurb: 'The default sky.', kind: 'theme', cost: 0, accent: '#8ab4ff', accentSoft: '#5a7fd6' },
  { id: 'theme_ember', name: 'Ember', blurb: 'Warm, low light. For evening people.', kind: 'theme', cost: 60, accent: '#ff9a62', accentSoft: '#d46b3a' },
  { id: 'theme_grove', name: 'Grove', blurb: 'Green and quiet.', kind: 'theme', cost: 60, accent: '#5fd6a3', accentSoft: '#2f9c72' },
  { id: 'theme_dusk', name: 'Dusk', blurb: 'Violet, just after sunset.', kind: 'theme', cost: 120, accent: '#c08bff', accentSoft: '#8a5cd6' },
  { id: 'theme_gold', name: 'Lantern', blurb: 'Old gold. Earned late.', kind: 'theme', cost: 240, accent: '#ffd479', accentSoft: '#d4a63c' },
  { id: 'theme_tide', name: 'Tide', blurb: 'Cold sea light.', kind: 'theme', cost: 240, accent: '#5fd0ff', accentSoft: '#2f96c9' },

  { id: 'sigil_seed', name: 'Seedling', blurb: 'A small green start.', kind: 'sigil', cost: 0, glyph: '🌱' },
  { id: 'sigil_moon', name: 'Crescent', blurb: '', kind: 'sigil', cost: 40, glyph: '🌙' },
  { id: 'sigil_flame', name: 'Flame', blurb: '', kind: 'sigil', cost: 40, glyph: '🔥' },
  { id: 'sigil_star', name: 'Star', blurb: '', kind: 'sigil', cost: 80, glyph: '⭐' },
  { id: 'sigil_leaf', name: 'Leaf', blurb: '', kind: 'sigil', cost: 80, glyph: '🍃' },
  { id: 'sigil_owl', name: 'Owl', blurb: '', kind: 'sigil', cost: 120, glyph: '🦉' },
  { id: 'sigil_mountain', name: 'Mountain', blurb: '', kind: 'sigil', cost: 160, glyph: '🏔️' },
  { id: 'sigil_lantern', name: 'Lantern', blurb: '', kind: 'sigil', cost: 200, glyph: '🏮' },
  { id: 'sigil_compass', name: 'Compass', blurb: '', kind: 'sigil', cost: 200, glyph: '🧭' },
];

export const COSMETICS_BY_ID: Record<string, CosmeticDef> = Object.fromEntries(
  COSMETICS.map((c) => [c.id, c]),
);

export const THEMES = COSMETICS.filter((c) => c.kind === 'theme');
export const SIGILS = COSMETICS.filter((c) => c.kind === 'sigil');

/** One shield forgives one missed day without breaking a streak. */
export const SHIELD_COST = 90;

export const SEASONS: SeasonDef[] = [
  {
    id: 'winter',
    name: 'The Quiet Season',
    months: [11, 0, 1],
    emoji: '❄️',
    accent: '#8fd0ff',
    greeting: 'Short days. Small, warm progress counts double.',
    blurb: 'Winter is for maintenance, not heroics.',
  },
  {
    id: 'spring',
    name: 'The Green Season',
    months: [2, 3, 4],
    emoji: '🌱',
    accent: '#6fd6a0',
    greeting: 'Everything is starting again, including you.',
    blurb: 'Spring is for planting habits you want in the summer.',
  },
  {
    id: 'summer',
    name: 'The Bright Season',
    months: [5, 6, 7],
    emoji: '☀️',
    accent: '#ffce6a',
    greeting: 'Long light. Room for the ambitious version of the day.',
    blurb: 'Summer is for depth — the long sessions live here.',
  },
  {
    id: 'autumn',
    name: 'The Gathering Season',
    months: [8, 9, 10],
    emoji: '🍂',
    accent: '#ff9a62',
    greeting: 'Time to bring in what you grew.',
    blurb: 'Autumn is for finishing things and taking stock.',
  },
];

export function seasonFor(date: Date): SeasonDef {
  const m = date.getMonth();
  return SEASONS.find((s) => s.months.includes(m)) ?? SEASONS[0];
}

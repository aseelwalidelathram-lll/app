import type { UnlockDef } from '../types';

export interface CollectionDef {
  id: string;
  name: string;
  blurb: string;
  emoji: string;
  color: string;
  cards: UnlockDef[];
}

/**
 * Collections are sets you slowly fill in. They exist for the pleasure of a
 * complete row — never as a checklist you are behind on.
 */
export const COLLECTIONS: CollectionDef[] = [
  {
    id: 'hours',
    name: 'The Hours',
    blurb: 'Every part of the day has its own character. Find all five.',
    emoji: '🕰️',
    color: '#6fd7ff',
    cards: [
      { id: 'hour_dawn', name: 'Dawn', blurb: 'Something logged before 7am.', emoji: '🌅', tier: 1, group: 'hours', metric: 'bucket:dawn', target: 1 },
      { id: 'hour_morning', name: 'Morning', blurb: 'The hours the day is decided in.', emoji: '☀️', tier: 1, group: 'hours', metric: 'bucket:morning', target: 1 },
      { id: 'hour_afternoon', name: 'Afternoon', blurb: 'The long stretch.', emoji: '🌇', tier: 1, group: 'hours', metric: 'bucket:afternoon', target: 1 },
      { id: 'hour_evening', name: 'Evening', blurb: 'When the day is counted.', emoji: '🌆', tier: 1, group: 'hours', metric: 'bucket:evening', target: 1 },
      { id: 'hour_night', name: 'Night', blurb: 'The quiet shift.', emoji: '🌃', tier: 1, group: 'hours', metric: 'bucket:night', target: 1 },
    ],
  },
  {
    id: 'sides',
    name: 'Sides of a Life',
    blurb: 'Seven ways to spend an hour. Touch each of them.',
    emoji: '🧭',
    color: '#b98bff',
    cards: [
      { id: 'side_mind', name: 'Mind', blurb: 'An hour of study, reading or thinking.', emoji: '📖', tier: 1, group: 'sides', metric: 'cat:mind', target: 60 },
      { id: 'side_body', name: 'Body', blurb: 'An hour of movement, food, water or rest.', emoji: '🌿', tier: 1, group: 'sides', metric: 'cat:body', target: 30 },
      { id: 'side_spirit', name: 'Spirit', blurb: 'Time given to worship or stillness.', emoji: '🕊️', tier: 1, group: 'sides', metric: 'cat:spirit', target: 20 },
      { id: 'side_craft', name: 'Craft', blurb: 'An hour making something.', emoji: '✨', tier: 1, group: 'sides', metric: 'cat:craft', target: 60 },
      { id: 'side_order', name: 'Order', blurb: 'Friction reduced.', emoji: '🗂️', tier: 1, group: 'sides', metric: 'cat:order', target: 30 },
      { id: 'side_bonds', name: 'Bonds', blurb: 'Time given to people.', emoji: '🤝', tier: 1, group: 'sides', metric: 'cat:bonds', target: 30 },
      { id: 'side_resolve', name: 'Resolve', blurb: 'A limit held on purpose.', emoji: '🌙', tier: 1, group: 'sides', metric: 'cat:resolve', target: 1 },
    ],
  },
  {
    id: 'road',
    name: 'The Long Road',
    blurb: 'Distance markers. The only collection that takes real time.',
    emoji: '🛤️',
    color: '#ffd479',
    cards: [
      { id: 'road_7', name: 'First Week', blurb: 'Seven days lived and recorded.', emoji: '🌾', tier: 1, group: 'road', metric: 'active_days', target: 7 },
      { id: 'road_30', name: 'First Month', blurb: 'Thirty days.', emoji: '🌻', tier: 2, group: 'road', metric: 'active_days', target: 30 },
      { id: 'road_100', name: 'Hundred Days', blurb: 'A hundred days of evidence.', emoji: '🏔️', tier: 3, group: 'road', metric: 'active_days', target: 100 },
      { id: 'road_365', name: 'A Year', blurb: 'Three hundred and sixty-five.', emoji: '🌍', tier: 4, group: 'road', metric: 'active_days', target: 365 },
    ],
  },
  {
    id: 'depths',
    name: 'Depths',
    blurb: 'Each card is an attribute carried past level ten.',
    emoji: '💠',
    color: '#7aa2ff',
    cards: [
      { id: 'depth_knowledge', name: 'Deep Knowledge', blurb: 'Knowledge past level 10.', emoji: '📚', tier: 2, group: 'depths', metric: 'attr:knowledge', target: 10 },
      { id: 'depth_discipline', name: 'Deep Discipline', blurb: 'Discipline past level 10.', emoji: '🛡️', tier: 2, group: 'depths', metric: 'attr:discipline', target: 10 },
      { id: 'depth_health', name: 'Deep Health', blurb: 'Health past level 10.', emoji: '🌿', tier: 2, group: 'depths', metric: 'attr:health', target: 10 },
      { id: 'depth_creativity', name: 'Deep Creativity', blurb: 'Creativity past level 10.', emoji: '🎨', tier: 2, group: 'depths', metric: 'attr:creativity', target: 10 },
      { id: 'depth_spirituality', name: 'Deep Spirit', blurb: 'Spirituality past level 10.', emoji: '🕊️', tier: 2, group: 'depths', metric: 'attr:spirituality', target: 10 },
      { id: 'depth_focus', name: 'Deep Focus', blurb: 'Focus past level 10.', emoji: '🎯', tier: 2, group: 'depths', metric: 'attr:focus', target: 10 },
      { id: 'depth_fitness', name: 'Deep Fitness', blurb: 'Fitness past level 10.', emoji: '💪', tier: 2, group: 'depths', metric: 'attr:fitness', target: 10 },
      { id: 'depth_organization', name: 'Deep Order', blurb: 'Organization past level 10.', emoji: '🗂️', tier: 2, group: 'depths', metric: 'attr:organization', target: 10 },
      { id: 'depth_relationships', name: 'Deep Bonds', blurb: 'Relationships past level 10.', emoji: '🤝', tier: 2, group: 'depths', metric: 'attr:relationships', target: 10 },
    ],
  },
  {
    id: 'quiet',
    name: 'Quiet Things',
    blurb: 'Small practices that nobody sees.',
    emoji: '🪷',
    color: '#ffb86b',
    cards: [
      { id: 'quiet_gratitude', name: 'Gratitude', blurb: 'Ten specific things named.', emoji: '🌾', tier: 1, group: 'quiet', metric: 'units:gratitude', target: 10 },
      { id: 'quiet_dhikr', name: 'Remembrance', blurb: 'Three hours of dhikr.', emoji: '📿', tier: 2, group: 'quiet', metric: 'units:dhikr', target: 180 },
      { id: 'quiet_stillness', name: 'Stillness', blurb: 'Three hours of sitting with nothing.', emoji: '🌌', tier: 2, group: 'quiet', metric: 'units:meditate', target: 180 },
      { id: 'quiet_journal', name: 'The Record', blurb: 'Twenty reflections written down.', emoji: '🪶', tier: 2, group: 'quiet', metric: 'count:reflect', target: 20 },
      { id: 'quiet_kindness', name: 'Unseen Kindness', blurb: 'Ten things done quietly for others.', emoji: '🤍', tier: 2, group: 'quiet', metric: 'units:kindness', target: 10 },
      { id: 'quiet_screen', name: 'Put It Down', blurb: 'Twenty-five screen-free hours.', emoji: '🌘', tier: 2, group: 'quiet', metric: 'units:screen_free', target: 25 },
    ],
  },
];

export const ALL_CARDS: UnlockDef[] = COLLECTIONS.flatMap((c) => c.cards);
export const CARDS_BY_ID: Record<string, UnlockDef> = Object.fromEntries(ALL_CARDS.map((c) => [c.id, c]));
export const COLLECTION_OF_CARD: Record<string, CollectionDef> = Object.fromEntries(
  COLLECTIONS.flatMap((col) => col.cards.map((c) => [c.id, col] as const)),
);

import type { AttributeDef, AttributeId, CategoryDef, CategoryId, UnitDef, UnitId, VitalId } from '../types';

export const ATTRIBUTES: Record<AttributeId, AttributeDef> = {
  knowledge: {
    id: 'knowledge',
    name: 'Knowledge',
    emoji: '📚',
    color: '#7aa2ff',
    blurb: 'What you understand, and how deeply.',
    governs: 'Grows from studying, reading, reviewing and teaching. Raises the value of every future study session.',
  },
  discipline: {
    id: 'discipline',
    name: 'Discipline',
    emoji: '🛡️',
    color: '#b98bff',
    blurb: 'Doing the thing when the feeling has left.',
    governs: 'Grows from consistency, early rising and kept promises. Strengthens streak protection.',
  },
  health: {
    id: 'health',
    name: 'Health',
    emoji: '🌿',
    color: '#4fd1a5',
    blurb: 'The body you will still be living in decades from now.',
    governs: 'Grows from water, food, sleep and rest. Raises your Energy ceiling each morning.',
  },
  creativity: {
    id: 'creativity',
    name: 'Creativity',
    emoji: '🎨',
    color: '#ff9ecb',
    blurb: 'Making something that was not there before.',
    governs: 'Grows from writing, building, drawing and play. Widens the Harmony bonus.',
  },
  spirituality: {
    id: 'spirituality',
    name: 'Spirituality',
    emoji: '🕊️',
    color: '#ffd479',
    blurb: 'The quiet centre the rest of the day turns around.',
    governs: 'Grows from Qur’an, prayer, dhikr and reflection. Restores Spirit, which steadies everything else.',
  },
  focus: {
    id: 'focus',
    name: 'Focus',
    emoji: '🎯',
    color: '#6fd7ff',
    blurb: 'The ability to stay with one thing.',
    governs: 'Grows from deep work, meditation and screen-free time. Raises your Clarity each morning.',
  },
  fitness: {
    id: 'fitness',
    name: 'Fitness',
    emoji: '💪',
    color: '#ff8a6b',
    blurb: 'Strength, wind, and the will to move.',
    governs: 'Grows from training, walking and sport. Pays energy forward into tomorrow.',
  },
  organization: {
    id: 'organization',
    name: 'Organization',
    emoji: '🗂️',
    color: '#9fb3d1',
    blurb: 'A life with less friction in it.',
    governs: 'Grows from planning, tidying and handling what you have been avoiding.',
  },
  relationships: {
    id: 'relationships',
    name: 'Relationships',
    emoji: '🤝',
    color: '#ffb86b',
    blurb: 'The people who will remember you.',
    governs: 'Grows from family, friends and kindness. Lifts Spirit more than anything else can.',
  },
};

export const ATTRIBUTE_IDS = Object.keys(ATTRIBUTES) as AttributeId[];

export const CATEGORIES: Record<CategoryId, CategoryDef> = {
  mind: { id: 'mind', name: 'Mind', emoji: '📖', color: '#7aa2ff', blurb: 'Study, reading, understanding' },
  body: { id: 'body', name: 'Body', emoji: '🌿', color: '#4fd1a5', blurb: 'Movement, food, water, rest' },
  spirit: { id: 'spirit', name: 'Spirit', emoji: '🕊️', color: '#ffd479', blurb: 'Worship, stillness, reflection' },
  craft: { id: 'craft', name: 'Craft', emoji: '✨', color: '#ff9ecb', blurb: 'Making, building, practising' },
  order: { id: 'order', name: 'Order', emoji: '🗂️', color: '#9fb3d1', blurb: 'Planning, tidying, admin' },
  bonds: { id: 'bonds', name: 'Bonds', emoji: '🤝', color: '#ffb86b', blurb: 'Family, friends, kindness' },
  resolve: { id: 'resolve', name: 'Resolve', emoji: '🌙', color: '#b98bff', blurb: 'Restraint kept, limits honoured' },
};

export const CATEGORY_IDS = Object.keys(CATEGORIES) as CategoryId[];

export const UNITS: Record<UnitId, UnitDef> = {
  minutes: { id: 'minutes', label: 'minutes', singular: 'minute', plural: 'minutes', step: 5, presets: [10, 20, 30, 45, 60, 90] },
  hours: { id: 'hours', label: 'hours', singular: 'hour', plural: 'hours', step: 0.5, presets: [5, 6, 7, 7.5, 8, 9] },
  count: { id: 'count', label: 'times', singular: 'time', plural: 'times', step: 1, presets: [1, 2, 3, 5] },
  pages: { id: 'pages', label: 'pages', singular: 'page', plural: 'pages', step: 1, presets: [1, 2, 5, 10, 20] },
  glasses: { id: 'glasses', label: 'glasses', singular: 'glass', plural: 'glasses', step: 1, presets: [1, 2, 3, 4] },
};

export interface VitalDef {
  id: VitalId;
  name: string;
  emoji: string;
  color: string;
  blurb: string;
  /** What it does mechanically, in one line. */
  effect: string;
}

export const VITALS: Record<VitalId, VitalDef> = {
  energy: {
    id: 'energy',
    name: 'Energy',
    emoji: '⚡',
    color: '#ffcf5c',
    blurb: 'What the body has left to give today.',
    effect: 'Restored by sleep, food and rest. Governs how much physical effort pays out.',
  },
  clarity: {
    id: 'clarity',
    name: 'Clarity',
    emoji: '💠',
    color: '#6fd7ff',
    blurb: 'How clear the inside of your head is.',
    effect: 'Restored by sleep, stillness and screen-free time. Governs how much study pays out.',
  },
  spirit: {
    id: 'spirit',
    name: 'Spirit',
    emoji: '🔆',
    color: '#ffb86b',
    blurb: 'Whether today feels like it means something.',
    effect: 'Restored by worship, people and making things. Steadies the whole day.',
  },
};

export const VITAL_IDS = Object.keys(VITALS) as VitalId[];

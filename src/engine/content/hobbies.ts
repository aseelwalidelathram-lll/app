/**
 * Starting points, not content.
 *
 * A hobby in the save file is entirely the player's own. This list only exists
 * so that setting one up is a tap rather than a form — every field here is
 * editable the moment it lands, and nothing breaks if all of it is deleted.
 *
 * Each one brings its own nouns, because a shelf of *books* and a shelf of
 * *projects* are not the same object wearing different labels, and an app that
 * calls both of them "items" is an app that has never met either.
 */

import type { Hobby } from '../types';

export type HobbyBlueprint = Omit<Hobby, 'id' | 'createdAt' | 'shelf'>;

export const HOBBY_BLUEPRINTS: HobbyBlueprint[] = [
  {
    name: 'Reading',
    emoji: '📖',
    color: '#8ab4ff',
    blurb: 'The pile by the bed, and everything that has ever been on it.',
    shelfNoun: 'books',
    shelfNounSingular: 'book',
    defaultItemUnit: 'pages',
    actionIds: ['read'],
  },
  {
    name: 'Baking',
    emoji: '🧁',
    color: '#ffb27a',
    blurb: 'Recipes you mean to try, and the ones that came out right.',
    shelfNoun: 'recipes',
    shelfNounSingular: 'recipe',
    defaultItemUnit: 'batches',
    actionIds: ['bake'],
  },
  {
    name: 'Crochet',
    emoji: '🧶',
    color: '#ff9ec4',
    blurb: 'Projects in progress, and the yarn waiting for a plan.',
    shelfNoun: 'projects',
    shelfNounSingular: 'project',
    defaultItemUnit: 'rows',
    actionIds: ['crochet'],
  },
  {
    name: 'Sudoku',
    emoji: '🔢',
    color: '#5fd6c9',
    blurb: 'Puzzle books and the grids still empty in them.',
    shelfNoun: 'puzzle books',
    shelfNounSingular: 'puzzle book',
    defaultItemUnit: 'puzzles',
    actionIds: ['sudoku'],
  },
  {
    name: 'Maths',
    emoji: '➗',
    color: '#c79bff',
    blurb: 'Topics you are working through, one at a time.',
    shelfNoun: 'topics',
    shelfNounSingular: 'topic',
    defaultItemUnit: 'problems',
    actionIds: ['practice_problems', 'study', 'review'],
  },
  {
    name: 'Painting',
    emoji: '🖌️',
    color: '#ffd479',
    blurb: 'Pieces you have started, and ideas that are still only ideas.',
    shelfNoun: 'pieces',
    shelfNounSingular: 'piece',
    defaultItemUnit: 'sessions',
    actionIds: ['paint'],
  },
  {
    name: 'Games',
    emoji: '🎮',
    color: '#7fd98f',
    blurb: 'The backlog. It is allowed to be long.',
    shelfNoun: 'games',
    shelfNounSingular: 'game',
    defaultItemUnit: 'hours',
    actionIds: ['game'],
  },
];

/** Offered when someone builds a hobby from scratch. */
export const HOBBY_EMOJI = [
  '📖', '🧁', '🧶', '🔢', '➗', '🖌️', '🎮', '🎧', '🪴', '📷', '🍳', '✍️',
  '🎹', '🧵', '♟️', '🚴', '🧗', '🗺️', '🐦', '🔭', '🪡', '🎬', '☕', '✦',
];

export const HOBBY_PALETTE = [
  '#5fd6c9', '#8ab4ff', '#ffb27a', '#c79bff', '#7fd98f', '#ff9ec4', '#ffd479', '#ff8f8f',
];

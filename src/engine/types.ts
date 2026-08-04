/**
 * The domain model.
 *
 * Design rule: the save file holds only *facts* (what the player did, what
 * they chose, what has been awarded). Everything else — levels, streaks,
 * vitals, quest progress, achievements — is derived from those facts, so no
 * two systems can ever disagree with each other.
 */

export type AttributeId =
  | 'knowledge'
  | 'discipline'
  | 'health'
  | 'creativity'
  | 'spirituality'
  | 'focus'
  | 'fitness'
  | 'organization'
  | 'relationships';

export type VitalId = 'energy' | 'clarity' | 'spirit';

export type CategoryId = 'mind' | 'body' | 'spirit' | 'craft' | 'order' | 'bonds' | 'resolve';

export type UnitId = 'minutes' | 'hours' | 'count' | 'pages' | 'glasses';

export interface AttributeDef {
  id: AttributeId;
  name: string;
  emoji: string;
  color: string;
  blurb: string;
  /** Shown on the character sheet: what this attribute actually governs. */
  governs: string;
}

export interface CategoryDef {
  id: CategoryId;
  name: string;
  emoji: string;
  color: string;
  blurb: string;
}

export interface UnitDef {
  id: UnitId;
  label: string;
  singular: string;
  plural: string;
  step: number;
  presets: number[];
}

export interface ActionDef {
  id: string;
  name: string;
  emoji: string;
  category: CategoryId;
  blurb: string;
  unit: UnitId;
  /** XP per unit, before any multipliers. */
  xpPerUnit: number;
  /** Attribute XP per unit. */
  attributes: Partial<Record<AttributeId, number>>;
  /** Immediate vital change per unit. */
  vitals: Partial<Record<VitalId, number>>;
  /** The vital that governs how well this action goes today. */
  keyVital: VitalId;
  /** Effort past this many units still counts, with gentle diminishing returns. */
  softCap: number;
  /** Cumulative units for mastery tier 1. Later tiers are multiples of it. */
  masteryStep: number;
  tags: string[];
  /** A good default amount when logging in a hurry. */
  quickAmount: number;
  /** Restfulness paid forward to tomorrow, per unit. */
  restores?: number;
  /** Strain accumulated per unit — too much today softens tomorrow's baseline. */
  strain?: number;
}

/* ------------------------------------------------------------------- log */

export interface LogEntry {
  id: string;
  actionId: string;
  /** Local day key this entry belongs to. */
  date: string;
  /** Epoch ms — used for time-of-day flavour and ordering. */
  at: number;
  amount: number;
  note?: string;
  /** Optional: the hobby this hour belonged to. */
  hobbyId?: string;
  /**
   * Optional: the specific thing on that hobby's shelf. Shelf progress is the
   * sum of these, so a book's page count is derived from the log like
   * everything else rather than being a counter someone has to keep correct.
   */
  itemId?: string;
  /** XP actually awarded, frozen at log time so history never rewrites itself. */
  xp: number;
  attributeXp: Partial<Record<AttributeId, number>>;
  /** Breakdown of the multipliers that applied, for the "why" tooltip. */
  bonuses: { vital: number; mastery: number; harmony: number };
}

/* ---------------------------------------------------------------- quests */

export type QuestScope = 'daily' | 'weekly' | 'monthly';

export type RequirementKind =
  | 'action_units'
  | 'action_days'
  | 'category_units'
  | 'tag_units'
  | 'attribute_xp'
  | 'distinct_actions'
  | 'distinct_categories'
  | 'total_xp'
  | 'ritual_days'
  | 'active_days';

export interface Requirement {
  kind: RequirementKind;
  target: number;
  actionId?: string;
  category?: CategoryId;
  tag?: string;
  attribute?: AttributeId;
}

export interface QuestReward {
  xp: number;
  sparks: number;
  attribute?: AttributeId;
  attributeXp?: number;
}

export interface Quest {
  id: string;
  scope: QuestScope;
  title: string;
  blurb: string;
  emoji: string;
  requirement: Requirement;
  reward: QuestReward;
  /** Why the world offered you this one today. */
  reason?: string;
}

export interface QuestPeriod {
  periodKey: string;
  quests: Quest[];
}

export interface QuestBoard {
  daily: QuestPeriod | null;
  weekly: QuestPeriod | null;
  monthly: QuestPeriod | null;
}

export interface QuestState extends Quest {
  current: number;
  complete: boolean;
  ratio: number;
  claimed: boolean;
}

/* --------------------------------------------------- goals & long arcs */

export interface MissionStage {
  name: string;
  target: number;
  reward: QuestReward;
}

export interface MissionDef {
  id: string;
  name: string;
  blurb: string;
  emoji: string;
  color: string;
  metric: MetricId;
  stages: MissionStage[];
}

export interface ChallengeDef {
  id: string;
  name: string;
  blurb: string;
  emoji: string;
  days: number;
  /** Evaluated per day inside the run window. */
  daily: Requirement;
  /** How many of the run's days must satisfy `daily`. */
  requiredDays: number;
  reward: QuestReward;
  badge: string;
}

export interface ChallengeRun {
  id: string;
  challengeId: string;
  startDate: string;
  /** Set when resolved so a finished run stops being re-evaluated. */
  resolved?: 'complete' | 'ended';
}

/* -------------------------------------------------- unlockable content */

export type MetricId = string;

export interface UnlockDef {
  id: string;
  name: string;
  blurb: string;
  emoji: string;
  /** 1 = gentle, 4 = the long haul. Drives colour and celebration size. */
  tier: 1 | 2 | 3 | 4;
  group: string;
  metric: MetricId;
  target: number;
  /** Hidden until unlocked — small delights, never required. */
  secret?: boolean;
}

export interface TitleDef {
  id: string;
  name: string;
  blurb: string;
  metric: MetricId;
  target: number;
}

export interface CosmeticDef {
  id: string;
  name: string;
  blurb: string;
  kind: 'theme' | 'sigil' | 'utility';
  cost: number;
  /** Theme accent colours. */
  accent?: string;
  accentSoft?: string;
  glyph?: string;
}

export interface SeasonDef {
  id: string;
  name: string;
  months: number[];
  emoji: string;
  accent: string;
  greeting: string;
  blurb: string;
}

/* -------------------------------------------------------------- hobbies */

/**
 * One thing on a hobby's shelf: a book to read, a game in the backlog, a
 * recipe to try, a piece to paint. Shelves are the personal half of the app —
 * nothing here is content anyone else wrote.
 */
export interface ShelfItem {
  id: string;
  title: string;
  /** Author, studio, whoever made it. Optional — plenty of things have no one. */
  by?: string;
  note?: string;
  /** How big it is, when it has a size: 244 pages, 12 episodes, 40 rows. */
  total?: number;
  /** What `total` counts, in this hobby's own words. */
  totalUnit?: string;
  addedAt: number;
  addedOn: string;
  /** Set when it is done. Finished things stay on the shelf as a record. */
  finishedOn?: string;
  /** Key into the image store — never the image itself, which lives in IndexedDB. */
  imageId?: string;
  /**
   * A cover that ships with the app rather than being uploaded on a device.
   * Takes precedence over `imageId`, and unlike it, survives a fresh install
   * and appears on every device.
   */
  coverUrl?: string;
}

export interface Hobby {
  id: string;
  name: string;
  emoji: string;
  color: string;
  /** What this shelf holds, in this hobby's language: "books", "games". */
  shelfNoun: string;
  /** What one entry on the shelf is called: "book", "game". */
  shelfNounSingular: string;
  /** What this hobby counts a thing's size in: "pages", "rows", "hours". */
  defaultItemUnit?: string;
  /** Actions whose logged time counts as time spent here. */
  actionIds: string[];
  blurb?: string;
  imageId?: string;
  /** A cover shipped with the app. See `ShelfItem.coverUrl`. */
  coverUrl?: string;
  createdAt: number;
  shelf: ShelfItem[];
  archived?: boolean;
}

/** A dated note about a hobby, optionally about one thing on its shelf. */
export interface JournalEntry {
  id: string;
  hobbyId: string;
  itemId?: string;
  date: string;
  at: number;
  text: string;
}

/* --------------------------------------------------------------- ledger */

export type LedgerSource =
  | 'quest'
  | 'achievement'
  | 'mission'
  | 'challenge'
  | 'title'
  | 'card'
  | 'pick';

/**
 * Rewards that did not come from an action directly. Keeping them as an
 * append-only ledger (rather than a mutable "sparks" counter) means every
 * point in the game can be traced back to the moment it was earned.
 */
export interface LedgerEntry {
  id: string;
  at: number;
  date: string;
  source: LedgerSource;
  refId: string;
  label: string;
  emoji: string;
  xp: number;
  sparks: number;
  attribute?: AttributeId;
  attributeXp?: number;
}

/* ------------------------------------------------------------ save file */

export interface Profile {
  name: string;
  sigil: string;
  activeTitle: string | null;
  theme: string;
}

export interface Settings {
  reducedMotion: boolean;
  dayStartHour: number;
  eveningHour: number;
}

export interface SaveState {
  version: number;
  createdAt: number;
  seed: number;
  profile: Profile;
  log: LogEntry[];
  /** The handful of actions that define a complete day for this player. */
  rituals: string[];
  questBoard: QuestBoard;
  /** Quest id -> date claimed. Claiming is how quest rewards enter the economy. */
  claimedQuests: Record<string, string>;
  unlocked: {
    achievements: Record<string, string>;
    cards: Record<string, string>;
    titles: Record<string, string>;
    cosmetics: string[];
  };
  /** The player's own hobbies. Entirely user-made — no defaults ship here. */
  hobbies: Hobby[];
  journal: JournalEntry[];
  /**
   * `hobbyId:weekKey` -> itemId, when the player chose this week's pick by hand
   * instead of taking the one offered.
   */
  pickOverrides: Record<string, string>;
  /** `hobbyId:itemId` -> date the finishing reward was paid. Paid once, ever. */
  claimedPicks: Record<string, string>;
  /** Mission stage index already collected. */
  missionStages: Record<string, number>;
  challenges: ChallengeRun[];
  ledger: LedgerEntry[];
  sparksSpent: number;
  purchasedShields: number;
  seen: {
    lastMorningBrief: string | null;
    lastEveningReview: string | null;
    onboarded: boolean;
  };
  settings: Settings;
}

/* --------------------------------------------------------------- events */

export type GameEventKind =
  | 'xp'
  | 'attribute'
  | 'attribute_level'
  | 'level'
  | 'vital'
  | 'quest_progress'
  | 'quest_complete'
  | 'achievement'
  | 'card'
  | 'title'
  | 'mastery'
  | 'streak'
  | 'mission'
  | 'challenge'
  | 'sparks'
  | 'note';

export interface GameEvent {
  id: string;
  kind: GameEventKind;
  title: string;
  detail?: string;
  emoji?: string;
  color?: string;
  /** Bigger moments get a bigger celebration. */
  weight: 1 | 2 | 3;
}

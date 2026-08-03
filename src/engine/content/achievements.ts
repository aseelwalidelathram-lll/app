import type { UnlockDef } from '../types';

/**
 * Achievements are uniformly `metric >= target`, which means every one of them
 * can show honest progress while still locked. Nothing here is hidden behind a
 * wall you cannot see the height of.
 *
 * Tone rule: no achievement is ever awarded for *not* doing something, and
 * none of them punish. "Return" exists specifically to make coming back after
 * a gap feel like an accomplishment instead of a failure.
 */
export const ACHIEVEMENTS: UnlockDef[] = [
  /* ------------------------------------------------------- beginnings */
  { id: 'first_step', name: 'First Step', blurb: 'You logged something. That is how all of it starts.', emoji: '🌱', tier: 1, group: 'Beginnings', metric: 'entries', target: 1 },
  { id: 'first_day', name: 'Day One', blurb: 'A full day, on the record.', emoji: '🌤️', tier: 1, group: 'Beginnings', metric: 'active_days', target: 1 },
  { id: 'ten_entries', name: 'Getting the Hang of It', blurb: 'Ten actions logged.', emoji: '🪄', tier: 1, group: 'Beginnings', metric: 'entries', target: 10 },
  { id: 'first_level', name: 'Level Two', blurb: 'The first level is always the sweetest.', emoji: '✨', tier: 1, group: 'Beginnings', metric: 'level', target: 2 },
  { id: 'first_quest', name: 'Quest Accepted', blurb: 'Your first quest, completed.', emoji: '📜', tier: 1, group: 'Beginnings', metric: 'quests_done', target: 1 },

  /* ------------------------------------------------------ consistency */
  { id: 'streak_3', name: 'Three in a Row', blurb: 'Three consecutive days.', emoji: '🔥', tier: 1, group: 'Consistency', metric: 'streak', target: 3 },
  { id: 'streak_7', name: 'A Full Week', blurb: 'Seven days without breaking the thread.', emoji: '🔥', tier: 2, group: 'Consistency', metric: 'best_streak', target: 7 },
  { id: 'streak_30', name: 'The Long Thread', blurb: 'Thirty consecutive days.', emoji: '🧵', tier: 3, group: 'Consistency', metric: 'best_streak', target: 30 },
  { id: 'streak_100', name: 'Hundred Days', blurb: 'One hundred days in a row. Very few people ever see this.', emoji: '💯', tier: 4, group: 'Consistency', metric: 'best_streak', target: 100 },
  { id: 'streak_365', name: 'A Year Unbroken', blurb: 'Three hundred and sixty-five days.', emoji: '🌍', tier: 4, group: 'Consistency', metric: 'best_streak', target: 365 },
  { id: 'active_30', name: 'A Month Present', blurb: 'Thirty days with something on them.', emoji: '🗓️', tier: 2, group: 'Consistency', metric: 'active_days', target: 30 },
  { id: 'active_100', name: 'A Hundred Days Lived', blurb: 'One hundred days on the record.', emoji: '📔', tier: 3, group: 'Consistency', metric: 'active_days', target: 100 },
  { id: 'active_365', name: 'A Year of Days', blurb: 'A full year of showing up, streak or not.', emoji: '🎆', tier: 4, group: 'Consistency', metric: 'active_days', target: 365 },
  { id: 'perfect_1', name: 'A Complete Day', blurb: 'Every ritual, all in one day.', emoji: '🌗', tier: 1, group: 'Consistency', metric: 'perfect_days', target: 1 },
  { id: 'perfect_10', name: 'Ten Complete Days', blurb: 'Ten days where nothing was left undone.', emoji: '🌕', tier: 3, group: 'Consistency', metric: 'perfect_days', target: 10 },
  { id: 'perfect_50', name: 'Fifty Complete Days', blurb: 'The rituals now keep themselves.', emoji: '🌟', tier: 4, group: 'Consistency', metric: 'perfect_days', target: 50 },
  { id: 'return', name: 'Return', blurb: 'You came back after a gap. This is the achievement that matters most.', emoji: '🫧', tier: 2, group: 'Consistency', metric: 'comebacks', target: 1 },
  { id: 'return_5', name: 'Always Comes Back', blurb: 'Five separate returns. Rest is part of the rhythm, not a failure of it.', emoji: '🕊️', tier: 3, group: 'Consistency', metric: 'comebacks', target: 5 },

  /* -------------------------------------------------------------- mind */
  { id: 'study_10h', name: 'Ten Hours In', blurb: '600 minutes of study.', emoji: '📘', tier: 1, group: 'Mind', metric: 'units:study', target: 600 },
  { id: 'study_50h', name: 'Fifty Hours In', blurb: '3,000 minutes of study.', emoji: '📗', tier: 2, group: 'Mind', metric: 'units:study', target: 3000 },
  { id: 'study_200h', name: 'Two Hundred Hours', blurb: '12,000 minutes. This is where expertise starts.', emoji: '📕', tier: 4, group: 'Mind', metric: 'units:study', target: 12000 },
  { id: 'review_habit', name: 'The Reviewer', blurb: 'Reviewing on 30 different days — the rarest study habit there is.', emoji: '🔁', tier: 3, group: 'Mind', metric: 'days:review', target: 30 },
  { id: 'knowledge_10', name: 'Knowledge 10', blurb: 'Knowledge reached level 10.', emoji: '📚', tier: 2, group: 'Mind', metric: 'attr:knowledge', target: 10 },
  { id: 'knowledge_25', name: 'Knowledge 25', blurb: 'Knowledge reached level 25.', emoji: '🎓', tier: 4, group: 'Mind', metric: 'attr:knowledge', target: 25 },
  { id: 'reader', name: 'Reader', blurb: 'Read a book on 50 different days.', emoji: '📖', tier: 3, group: 'Mind', metric: 'days:read', target: 50 },
  { id: 'teacher', name: 'The Explainer', blurb: 'Taught or explained something 20 times.', emoji: '🧑‍🏫', tier: 3, group: 'Mind', metric: 'count:teach', target: 20 },

  /* -------------------------------------------------------------- body */
  { id: 'water_100', name: 'Hundred Glasses', blurb: 'A hundred small good decisions.', emoji: '💧', tier: 1, group: 'Body', metric: 'units:water', target: 100 },
  { id: 'water_1000', name: 'A Thousand Glasses', blurb: 'One thousand. Nobody noticed but your body did.', emoji: '🌊', tier: 4, group: 'Body', metric: 'units:water', target: 1000 },
  { id: 'move_30', name: 'Thirty Sessions', blurb: 'Thirty days with real movement in them.', emoji: '🏃', tier: 2, group: 'Body', metric: 'days:exercise', target: 30 },
  { id: 'fitness_10', name: 'Fitness 10', blurb: 'Fitness reached level 10.', emoji: '💪', tier: 2, group: 'Body', metric: 'attr:fitness', target: 10 },
  { id: 'fitness_20', name: 'Fitness 20', blurb: 'A body you built on purpose.', emoji: '🦾', tier: 4, group: 'Body', metric: 'attr:fitness', target: 20 },
  { id: 'sleep_30', name: 'Thirty Nights', blurb: 'Sleep tracked on 30 nights.', emoji: '🌙', tier: 2, group: 'Body', metric: 'days:sleep', target: 30 },
  { id: 'health_15', name: 'Health 15', blurb: 'Health reached level 15.', emoji: '🌿', tier: 3, group: 'Body', metric: 'attr:health', target: 15 },
  { id: 'walker', name: 'Ten Thousand Minutes', blurb: 'Walking adds up to more than anything else here.', emoji: '🚶', tier: 3, group: 'Body', metric: 'units:walk', target: 10000 },

  /* ------------------------------------------------------------ spirit */
  { id: 'quran_juz', name: 'The First Twenty', blurb: 'Twenty pages of Qur’an read.', emoji: '🕌', tier: 1, group: 'Spirit', metric: 'units:quran', target: 20 },
  { id: 'quran_100', name: 'A Hundred Pages', blurb: 'A hundred pages, page by page.', emoji: '📿', tier: 2, group: 'Spirit', metric: 'units:quran', target: 100 },
  { id: 'quran_khatm', name: 'Cover to Cover', blurb: '604 pages — a complete reading.', emoji: '🌟', tier: 4, group: 'Spirit', metric: 'units:quran', target: 604 },
  { id: 'prayer_100', name: 'A Hundred Prayers', blurb: 'Kept, one at a time.', emoji: '🤲', tier: 2, group: 'Spirit', metric: 'units:prayer', target: 100 },
  { id: 'prayer_1000', name: 'A Thousand Prayers', blurb: 'The steadiest thing in your record.', emoji: '✨', tier: 4, group: 'Spirit', metric: 'units:prayer', target: 1000 },
  { id: 'spirit_15', name: 'Spirituality 15', blurb: 'Spirituality reached level 15.', emoji: '🕊️', tier: 3, group: 'Spirit', metric: 'attr:spirituality', target: 15 },
  { id: 'stillness_30', name: 'Thirty Still Days', blurb: 'Stillness practised on 30 days.', emoji: '🌌', tier: 3, group: 'Spirit', metric: 'days:meditate', target: 30 },
  { id: 'reflection_50', name: 'The Journal', blurb: 'Fifty reflections written.', emoji: '🪶', tier: 3, group: 'Spirit', metric: 'count:reflect', target: 50 },

  /* ------------------------------------------------------------- craft */
  { id: 'maker_1', name: 'Made Something', blurb: 'The first creative session.', emoji: '🎨', tier: 1, group: 'Craft', metric: 'cat:craft', target: 30 },
  { id: 'maker_50h', name: 'Fifty Hours of Making', blurb: '3,000 minutes spent building things.', emoji: '🛠️', tier: 3, group: 'Craft', metric: 'cat:craft', target: 3000 },
  { id: 'creativity_12', name: 'Creativity 12', blurb: 'Creativity reached level 12.', emoji: '🌈', tier: 3, group: 'Craft', metric: 'attr:creativity', target: 12 },

  /* ------------------------------------------------------------- order */
  { id: 'planner_20', name: 'The Planner', blurb: 'Planned the day 20 times.', emoji: '🗒️', tier: 2, group: 'Order', metric: 'count:plan', target: 20 },
  { id: 'order_10', name: 'Organization 10', blurb: 'Organization reached level 10.', emoji: '🗂️', tier: 2, group: 'Order', metric: 'attr:organization', target: 10 },
  { id: 'discipline_15', name: 'Discipline 15', blurb: 'Discipline reached level 15.', emoji: '🛡️', tier: 3, group: 'Order', metric: 'attr:discipline', target: 15 },

  /* ------------------------------------------------------------- bonds */
  { id: 'bond_1', name: 'Reached Out', blurb: 'The first message that mattered.', emoji: '📞', tier: 1, group: 'Bonds', metric: 'cat:bonds', target: 1 },
  { id: 'kindness_25', name: 'Twenty-Five Kindnesses', blurb: 'Things done for people who cannot repay them.', emoji: '🤍', tier: 3, group: 'Bonds', metric: 'units:kindness', target: 25 },
  { id: 'relationships_12', name: 'Relationships 12', blurb: 'Relationships reached level 12.', emoji: '🤝', tier: 3, group: 'Bonds', metric: 'attr:relationships', target: 12 },

  /* ------------------------------------------------------------ growth */
  { id: 'level_5', name: 'Level 5', blurb: 'A wanderer now.', emoji: '🧭', tier: 1, group: 'Growth', metric: 'level', target: 5 },
  { id: 'level_10', name: 'Level 10', blurb: 'An apprentice.', emoji: '⚗️', tier: 2, group: 'Growth', metric: 'level', target: 10 },
  { id: 'level_25', name: 'Level 25', blurb: 'An artisan of your own life.', emoji: '🏺', tier: 3, group: 'Growth', metric: 'level', target: 25 },
  { id: 'level_50', name: 'Level 50', blurb: 'Half a hundred. Years of evidence.', emoji: '👑', tier: 4, group: 'Growth', metric: 'level', target: 50 },
  { id: 'xp_10k', name: 'Ten Thousand', blurb: '10,000 experience earned.', emoji: '⭐', tier: 2, group: 'Growth', metric: 'total_xp', target: 10000 },
  { id: 'xp_100k', name: 'A Hundred Thousand', blurb: 'Six figures of small good decisions.', emoji: '🌠', tier: 4, group: 'Growth', metric: 'total_xp', target: 100000 },
  { id: 'balanced', name: 'Well Rounded', blurb: 'Every attribute at level 5 or above.', emoji: '⚖️', tier: 3, group: 'Growth', metric: 'min_attribute', target: 5 },
  { id: 'balanced_10', name: 'Nothing Neglected', blurb: 'Every attribute at level 10 or above.', emoji: '🔆', tier: 4, group: 'Growth', metric: 'min_attribute', target: 10 },
  { id: 'mastery_5', name: 'Five Masteries', blurb: 'Five actions carried to their first mastery tier.', emoji: '🎖️', tier: 3, group: 'Growth', metric: 'masteries', target: 5 },
  { id: 'quests_50', name: 'Fifty Quests', blurb: 'Fifty quests completed.', emoji: '📜', tier: 3, group: 'Growth', metric: 'quests_done', target: 50 },
  { id: 'quests_250', name: 'Questkeeper', blurb: 'Two hundred and fifty completed.', emoji: '🗺️', tier: 4, group: 'Growth', metric: 'quests_done', target: 250 },

  /* ------------------------------------------------------------ hidden */
  { id: 'dawn_10', name: 'Before the World Woke', blurb: 'Ten things logged before 7am.', emoji: '🌅', tier: 2, group: 'Curiosities', metric: 'bucket:dawn', target: 10, secret: true },
  { id: 'night_owl', name: 'The Late Shift', blurb: 'Fifty things logged after 10pm. No judgement.', emoji: '🦉', tier: 2, group: 'Curiosities', metric: 'bucket:night', target: 50, secret: true },
  { id: 'big_day', name: 'One Enormous Day', blurb: 'Over 500 XP in a single day.', emoji: '🎇', tier: 3, group: 'Curiosities', metric: 'best_day_xp', target: 500, secret: true },
  { id: 'wide_life', name: 'A Wide Life', blurb: 'Fifty days touching four or more sides of life.', emoji: '🧩', tier: 3, group: 'Curiosities', metric: 'harmony_days', target: 50, secret: true },
  { id: 'everything', name: 'Tried Everything', blurb: 'Used every single action at least once.', emoji: '🔮', tier: 4, group: 'Curiosities', metric: 'distinct_actions', target: 36, secret: true },
];

export const ACHIEVEMENT_GROUPS = Array.from(new Set(ACHIEVEMENTS.map((a) => a.group)));
export const ACHIEVEMENTS_BY_ID: Record<string, UnlockDef> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a]),
);

/** Sparks and XP awarded when an achievement unlocks, by tier. */
export const TIER_REWARD: Record<number, { xp: number; sparks: number }> = {
  1: { xp: 40, sparks: 3 },
  2: { xp: 120, sparks: 8 },
  3: { xp: 350, sparks: 20 },
  4: { xp: 900, sparks: 45 },
};

export const TIER_COLOR: Record<number, string> = {
  1: '#7fd6a8',
  2: '#6fd7ff',
  3: '#b98bff',
  4: '#ffd479',
};

export const TIER_NAME: Record<number, string> = {
  1: 'Bronze',
  2: 'Silver',
  3: 'Gold',
  4: 'Radiant',
};

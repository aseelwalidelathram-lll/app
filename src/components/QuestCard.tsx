import { ACTIONS, round } from '../engine';
import type { QuestState } from '../engine';
import { Meter } from './ui';

export function QuestCard({ quest, onAct }: { quest: QuestState; onAct?: (actionId: string) => void }) {
  const actionId = quest.requirement.actionId;
  const action = actionId ? ACTIONS[actionId] : undefined;

  return (
    <div className={`quest ${quest.complete ? 'done' : ''}`}>
      <span className="icon">{quest.emoji}</span>
      <div className="body">
        <div className="name">
          {quest.title}
          {quest.complete && <span className="tick">✓</span>}
        </div>
        <div className="desc">{quest.blurb}</div>
        {quest.reason && !quest.complete && <div className="why">{quest.reason}</div>}

        <div className="footer">
          <Meter ratio={quest.ratio} color={quest.complete ? 'var(--good)' : 'var(--accent)'} />
          <span className="prog">
            {/* Overshoot reads like a bug on a finished quest — cap the display. */}
            {round(Math.min(quest.current, quest.requirement.target), 1)} / {quest.requirement.target}
          </span>
        </div>

        <div className="row" style={{ marginTop: 8, gap: 8 }}>
          <span className="reward">
            +{quest.reward.xp} XP · +{quest.reward.sparks} ✦
          </span>
          <span className="spacer" />
          {!quest.complete && action && onAct && (
            <button className="btn sm" onClick={() => onAct(action.id)}>
              {action.emoji} Log {action.name}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

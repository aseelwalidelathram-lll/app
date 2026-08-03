import { ATTRIBUTES, eveningReview, fmtAmount, morningBrief, round } from '../engine';
import { QuestCard } from '../components/QuestCard';
import { Chip, Meter, Sheet } from '../components/ui';
import { useStore } from '../state/context';

/* --------------------------------------------------------------- morning */

export function MorningBrief({ onClose, onLog }: { onClose: () => void; onLog: (id?: string) => void }) {
  const { world, saw } = useStore();
  const brief = morningBrief(world);

  const close = () => {
    saw('lastMorningBrief');
    onClose();
  };

  return (
    <Sheet
      title={brief.greeting}
      subtitle={brief.openingLine}
      emoji="🌄"
      onClose={close}
      footer={
        <button className="btn primary wide" onClick={close}>
          Begin the day
        </button>
      }
    >
      <div className="stack" style={{ gap: 18 }}>
        <div className="preview">
          <span className="chip">{brief.seasonLine}</span>
          <span className="chip gold">~{brief.projectedXp} XP available today</span>
          <span className="chip">🔥 {world.streak.current}-day streak</span>
        </div>

        {brief.streaksToProtect.length > 0 && (
          <div>
            <div className="card-title">Worth protecting</div>
            <div className="row-wrap">
              {brief.streaksToProtect.map((s) => (
                <Chip key={s.actionId} onClick={() => onLog(s.actionId)}>
                  {s.emoji} {s.name} · {s.days} days
                </Chip>
              ))}
            </div>
            <div className="hint" style={{ marginTop: 8 }}>
              {world.streak.graceBudget - world.streak.graceUsed > 0
                ? `And if one of them slips today, a grace day catches it — you have ${
                    world.streak.graceBudget - world.streak.graceUsed
                  } in hand.`
                : 'And if one slips today, it slips. A streak is a nice thing to have, not a thing to be afraid of losing.'}
            </div>
          </div>
        )}

        <div>
          <div className="card-title">Today’s quests</div>
          <div className="stack" style={{ gap: 8 }}>
            {brief.quests.map((q) => (
              <QuestCard key={q.id} quest={q} onAct={onLog} />
            ))}
          </div>
        </div>

        <div>
          <div className="card-title">Where I’d start</div>
          <div className="stack" style={{ gap: 8 }}>
            {brief.priorities.map((p) => (
              <button key={p.action.id} className="action-tile" onClick={() => onLog(p.action.id)}>
                <span className="emoji">{p.action.emoji}</span>
                <span className="t">
                  <span className="n">
                    {p.action.name}
                    <span className="faint" style={{ fontWeight: 400 }}>
                      {' '}
                      · {fmtAmount(p.action.unit, p.amount)}
                    </span>
                  </span>
                  <span className="d">{p.reason}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="hint">{brief.vitalNote}</div>
      </div>
    </Sheet>
  );
}

/* --------------------------------------------------------------- evening */

export function EveningReview({ onClose }: { onClose: () => void }) {
  const { world, saw } = useStore();
  const review = eveningReview(world);

  const close = () => {
    saw('lastEveningReview');
    onClose();
  };

  return (
    <Sheet
      title={review.headline}
      subtitle={`${review.entries} thing${review.entries === 1 ? '' : 's'} logged · ${review.xp} XP`}
      emoji="🌙"
      onClose={close}
      footer={
        <button className="btn primary wide" onClick={close}>
          Close the day
        </button>
      }
    >
      <div className="stack" style={{ gap: 18 }}>
        {review.highlights.length > 0 && (
          <div>
            <div className="card-title">What you did</div>
            <div className="stack" style={{ gap: 6 }}>
              {review.highlights.map((h) => (
                <div key={h} className="small">
                  {h}
                </div>
              ))}
            </div>
          </div>
        )}

        {review.attributesMoved.length > 0 && (
          <div>
            <div className="card-title">What grew</div>
            <div className="stack" style={{ gap: 9 }}>
              {review.attributesMoved.slice(0, 5).map((a) => {
                const def = ATTRIBUTES[a.id];
                const stat = world.attributes[a.id];
                return (
                  <div key={a.id}>
                    <div className="row tiny" style={{ marginBottom: 4 }}>
                      <span style={{ color: def.color }}>
                        {def.emoji} {def.name}
                      </span>
                      <span className="spacer" />
                      <span className="faint num">
                        +{round(a.xp, 1)} · level {stat.level.level}
                      </span>
                    </div>
                    <Meter ratio={stat.level.ratio} color={def.color} className="thin" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {review.questsCompleted.length > 0 && (
          <div>
            <div className="card-title">Quests finished</div>
            <div className="row-wrap">
              {review.questsCompleted.map((q) => (
                <Chip key={q.id} gold>
                  {q.emoji} {q.title}
                </Chip>
              ))}
            </div>
          </div>
        )}

        <div className="preview">
          <span className="chip">🔥 {review.streakLine}</span>
          <span className="chip">🌄 {review.outlookLine}</span>
        </div>

        <div>
          <div className="card-title">Tomorrow, if you want it</div>
          <div className="row-wrap">
            {review.tomorrow.map((p) => (
              <Chip key={p.action.id}>
                {p.action.emoji} {p.action.name}
              </Chip>
            ))}
          </div>
        </div>

        <div className="hint" style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          {review.closing}
        </div>
      </div>
    </Sheet>
  );
}

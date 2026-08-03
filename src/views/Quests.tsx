import {
  CHALLENGES,
  CHALLENGES_BY_ID,
  MISSIONS,
  addDays,
  daysBetween,
  evaluateRequirement,
  monthName,
  prettyDate,
  rangeKeys,
  round,
  weekEnd,
} from '../engine';
import { QuestCard } from '../components/QuestCard';
import { Card, Chip, Meter } from '../components/ui';
import { useStore } from '../state/context';

export function Quests({ onLog }: { onLog: (actionId?: string) => void }) {
  const { world } = useStore();

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="page-head">
        <h1>Quests & missions</h1>
        <p className="sub">
          Daily quests are drawn fresh each morning. Weekly and monthly ones sit underneath them. Missions are
          the long arcs — the things you are actually doing with your life — and challenges are opt-in sprints
          that cost nothing if you don't finish them.
        </p>
      </div>

      <Card
        title="Today"
        aside={<span className="tiny faint">resets at {String(world.save.settings.dayStartHour).padStart(2, '0')}:00</span>}
      >
        <div className="stack" style={{ gap: 9 }}>
          {world.quests.daily.map((q) => (
            <QuestCard key={q.id} quest={q} onAct={onLog} />
          ))}
        </div>
      </Card>

      <div className="grid g2">
        <Card title="This week" aside={<span className="tiny faint">to {prettyDate(weekEnd(world.today))}</span>}>
          <div className="stack" style={{ gap: 9 }}>
            {world.quests.weekly.map((q) => (
              <QuestCard key={q.id} quest={q} onAct={onLog} />
            ))}
          </div>
        </Card>

        <Card title={`${monthName(world.today)}`}>
          <div className="stack" style={{ gap: 9 }}>
            {world.quests.monthly.map((q) => (
              <QuestCard key={q.id} quest={q} onAct={onLog} />
            ))}
          </div>
        </Card>
      </div>

      <Missions />
      <Challenges />
    </div>
  );
}

/* -------------------------------------------------------------- missions */

function Missions() {
  const { world, save } = useStore();

  return (
    <Card title="Long missions">
      <div className="grid g2" style={{ gap: 12 }}>
        {MISSIONS.map((m) => {
          const value = world.metric(m.metric);
          const stageIndex = save.missionStages[m.id] ?? 0;
          const complete = stageIndex >= m.stages.length;
          const stage = complete ? m.stages[m.stages.length - 1] : m.stages[stageIndex];
          const floor = stageIndex === 0 ? 0 : m.stages[stageIndex - 1].target;
          const ratio = complete ? 1 : Math.max(0, (value - floor) / Math.max(1, stage.target - floor));

          return (
            <div key={m.id} className="quest" style={{ borderColor: `color-mix(in oklab, ${m.color} 26%, transparent)` }}>
              <span className="icon">{m.emoji}</span>
              <div className="body">
                <div className="name">
                  {m.name}
                  {complete && <span className="tick">✓</span>}
                </div>
                <div className="desc">{m.blurb}</div>
                <div className="footer">
                  <Meter ratio={ratio} color={m.color} />
                  <span className="prog">
                    {round(Math.min(value, stage.target), 0)} / {stage.target}
                  </span>
                </div>
                <div className="row tiny" style={{ marginTop: 7 }}>
                  <span className="faint">
                    {complete ? 'Every stage reached.' : `Stage ${stageIndex + 1} of ${m.stages.length} — ${stage.name}`}
                  </span>
                  <span className="spacer" />
                  <span className="reward">+{stage.reward.xp} XP</span>
                </div>
                <div className="row-wrap" style={{ marginTop: 8, gap: 5 }}>
                  {m.stages.map((s, i) => (
                    <span
                      key={s.name}
                      className="chip"
                      style={{
                        padding: '2px 8px',
                        fontSize: 11,
                        opacity: i < stageIndex ? 1 : 0.42,
                        color: i < stageIndex ? m.color : undefined,
                        borderColor: i < stageIndex ? `color-mix(in oklab, ${m.color} 40%, transparent)` : undefined,
                      }}
                    >
                      {i < stageIndex ? '✓ ' : ''}
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------ challenges */

function Challenges() {
  const { world, save, beginChallenge, endChallenge } = useStore();
  const active = save.challenges.filter((c) => !c.resolved);
  const past = save.challenges.filter((c) => c.resolved);

  const progressOf = (runId: string) => {
    const run = save.challenges.find((c) => c.id === runId)!;
    const def = CHALLENGES_BY_ID[run.challengeId];
    const days = rangeKeys(run.startDate, addDays(run.startDate, def.days - 1));
    const met = days.filter(
      (d) =>
        evaluateRequirement(def.daily, world.entriesByDate[d] ?? [], {
          entriesByDate: world.entriesByDate,
          dayKeys: [d],
          rituals: save.rituals,
        }) >= def.daily.target,
    ).length;
    return { def, met, days, left: daysBetween(world.today, addDays(run.startDate, def.days - 1)) };
  };

  return (
    <Card title="Challenges">
      {active.length > 0 && (
        <div className="stack" style={{ gap: 10, marginBottom: 18 }}>
          {active.map((run) => {
            const { def, met, days, left } = progressOf(run.id);
            return (
              <div key={run.id} className="quest">
                <span className="icon">{def.emoji}</span>
                <div className="body">
                  <div className="name">{def.name}</div>
                  <div className="desc">{def.blurb}</div>
                  <div className="footer">
                    <Meter ratio={met / def.requiredDays} color="var(--gold)" />
                    <span className="prog">
                      {met} / {def.requiredDays} days
                    </span>
                  </div>
                  <div className="row-wrap" style={{ marginTop: 8, gap: 3 }}>
                    {days.map((d) => {
                      const hit =
                        evaluateRequirement(def.daily, world.entriesByDate[d] ?? [], {
                          entriesByDate: world.entriesByDate,
                          dayKeys: [d],
                          rituals: save.rituals,
                        }) >= def.daily.target;
                      const future = d > world.today;
                      return (
                        <span
                          key={d}
                          title={prettyDate(d)}
                          style={{
                            width: 11,
                            height: 11,
                            borderRadius: 3,
                            background: hit ? 'var(--gold)' : 'rgba(255,255,255,0.08)',
                            opacity: future ? 0.35 : 1,
                            outline: d === world.today ? '1.5px solid var(--accent)' : undefined,
                            outlineOffset: 1,
                          }}
                        />
                      );
                    })}
                  </div>
                  <div className="row" style={{ marginTop: 9 }}>
                    <span className="tiny faint">
                      {left >= 0 ? `${left + 1} day${left === 0 ? '' : 's'} left` : 'finishing'}
                    </span>
                    <span className="spacer" />
                    <button className="btn sm ghost" onClick={() => endChallenge(run.id)}>
                      Step away
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid g2" style={{ gap: 10 }}>
        {CHALLENGES.filter((c) => !active.some((a) => a.challengeId === c.id)).map((c) => (
          <div key={c.id} className="quest">
            <span className="icon">{c.emoji}</span>
            <div className="body">
              <div className="name">{c.name}</div>
              <div className="desc">{c.blurb}</div>
              <div className="row" style={{ marginTop: 9 }}>
                <span className="reward">
                  +{c.reward.xp} XP · +{c.reward.sparks} ✦
                </span>
                <span className="spacer" />
                <button className="btn sm" onClick={() => beginChallenge(c.id)}>
                  Begin · {c.days} days
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {past.length > 0 && (
        <>
          <div className="card-title" style={{ marginTop: 20 }}>
            Past attempts
          </div>
          <div className="row-wrap">
            {past.map((run) => {
              const def = CHALLENGES_BY_ID[run.challengeId];
              if (!def) return null;
              return (
                <Chip key={run.id} gold={run.resolved === 'complete'}>
                  {def.emoji} {def.name} · {run.resolved === 'complete' ? 'complete' : 'attempted'}
                </Chip>
              );
            })}
          </div>
          <div className="hint" style={{ marginTop: 9 }}>
            Attempts are kept, not scored. Starting something and stopping is still more than not starting.
          </div>
        </>
      )}
    </Card>
  );
}

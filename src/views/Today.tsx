import {
  ACTIONS,
  ATTRIBUTES,
  TITLES_BY_ID,
  VITALS,
  VITAL_IDS,
  fmtAmount,
  lifeScore,
  prettyDateLong,
  projectedDailyXp,
  round,
  scoreWord,
  seasonFor,
  suggestions,
} from '../engine';
import { QuestCard } from '../components/QuestCard';
import { Card, Chip, Meter, MeterRow, Ring, Sparkbars, Stat } from '../components/ui';
import { useStore } from '../state/context';

export function Today({ onLog }: { onLog: (actionId?: string) => void }) {
  const { world, save, undo } = useStore();
  const season = seasonFor(new Date());
  const title = save.profile.activeTitle ? TITLES_BY_ID[save.profile.activeTitle] : null;
  const day = world.todaySummary;
  const picks = suggestions(world, 4);
  const last14 = world.days.slice(-14);

  return (
    <div className="stack" style={{ gap: 18 }}>
      {/* ---------------------------------------------------------- hero */}
      <Card>
        <div className="hero">
          <div className="hero-copy">
            <div className="tiny faint" style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {prettyDateLong(world.today)} · {season.emoji} {season.name}
            </div>
            <div className="hero-name" style={{ marginTop: 6 }}>
              {save.profile.sigil} {save.profile.name}
            </div>
            {title && <div className="hero-title">{title.name}</div>}

            <div className="row" style={{ gap: 9, marginTop: 12, flexWrap: 'wrap' }}>
              <Chip gold>
                {world.rank.name} · Level {world.level.level}
              </Chip>
              <Chip>🔥 {world.streak.current}-day streak</Chip>
              <Chip>✦ {world.sparks} sparks</Chip>
              {world.streak.graceBudget - world.streak.graceUsed > 0 && (
                <Chip title="Grace days forgive a miss without breaking your streak.">
                  🛡️ {world.streak.graceBudget - world.streak.graceUsed} grace
                </Chip>
              )}
            </div>

            <div style={{ marginTop: 16 }}>
              <div className="row tiny faint" style={{ marginBottom: 6 }}>
                <span>
                  {world.level.into} / {world.level.span} XP
                </span>
                <span className="spacer" />
                <span>{world.level.toNext} to level {world.level.level + 1}</span>
              </div>
              <Meter ratio={world.level.ratio} className="thick" color={world.rank.color} />
              {world.upcomingRank && (
                <div className="tiny faint" style={{ marginTop: 7 }}>
                  {world.upcomingRank.name} at level {world.upcomingRank.from} — “{world.upcomingRank.blurb}”
                </div>
              )}
            </div>
          </div>

          <Ring ratio={lifeScore(world) / 100} size={148} stroke={10} color={world.rank.color}>
            <div className="big">{lifeScore(world)}</div>
            <div className="cap">Life score</div>
          </Ring>
        </div>
      </Card>

      {/* -------------------------------------------------------- vitals */}
      <div className="grid g3">
        {VITAL_IDS.map((v) => {
          const def = VITALS[v];
          const value = Math.round(world.vitals[v]);
          return (
            <div className="vital" key={v}>
              <div className="top">
                <span>{def.emoji}</span>
                <span className="name">{def.name}</span>
                <span className="value" style={{ color: def.color }}>
                  {value}
                </span>
              </div>
              <Meter ratio={value / 100} color={def.color} />
              <div className="tiny faint">{def.effect}</div>
            </div>
          );
        })}
      </div>

      <div className="grid g-hero">
        <div className="stack" style={{ gap: 18 }}>
          {/* ------------------------------------------------------ quests */}
          <Card
            title={<>Today’s quests</>}
            aside={
              <span className="tiny faint num">
                {world.quests.daily.filter((q) => q.complete).length}/{world.quests.daily.length} done
              </span>
            }
          >
            <div className="stack" style={{ gap: 9 }}>
              {world.quests.daily.map((q) => (
                <QuestCard key={q.id} quest={q} onAct={(id) => onLog(id)} />
              ))}
            </div>
            <div className="hint" style={{ marginTop: 13 }}>
              Drawn this morning from what has been quiet lately and what you were already doing. They reset
              tomorrow whether or not they are finished — nothing carries over as debt.
            </div>
          </Card>

          {/* -------------------------------------------------- suggestions */}
          <Card title="What would move the most right now">
            <div className="stack" style={{ gap: 9 }}>
              {picks.map((p) => (
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
                  <span className="tiny faint">→</span>
                </button>
              ))}
              {!picks.length && (
                <div className="hint">
                  Nothing pressing. That is a legitimate state — the app is not going to invent urgency for you.
                </div>
              )}
            </div>
          </Card>

          {/* ------------------------------------------------------ journal */}
          <Card
            title="Today’s record"
            aside={<span className="tiny faint num">{Math.round(day.xp)} XP</span>}
          >
            {world.todayEntries.length === 0 ? (
              <div className="empty">
                <span className="g">🌱</span>
                Nothing logged yet. The smallest thing counts — a glass of water is a real entry.
              </div>
            ) : (
              <div>
                {[...world.todayEntries].reverse().map((e) => {
                  const a = ACTIONS[e.actionId];
                  if (!a) return null;
                  return (
                    <div className="entry" key={e.id}>
                      <span className="e">{a.emoji}</span>
                      <div style={{ minWidth: 0 }}>
                        <div className="n">
                          {a.name}{' '}
                          <span className="faint">
                            {fmtAmount(a.unit, e.amount)}
                          </span>
                        </div>
                        {e.note && <div className="m">“{e.note}”</div>}
                      </div>
                      <span className="x">+{e.xp}</span>
                      <button className="undo" onClick={() => undo(e.id)} title="Remove this entry">
                        undo
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* ------------------------------------------------------- sidebar */}
        <div className="stack" style={{ gap: 18 }}>
          <Card title="Day completion">
            <Ring ratio={world.scores.completion / 100} size={104} stroke={8}>
              <div className="big" style={{ fontSize: 22 }}>
                {world.scores.completion}%
              </div>
            </Ring>
            <div className="stack" style={{ gap: 7, marginTop: 14 }}>
              {save.rituals.map((r) => {
                const a = ACTIONS[r];
                if (!a) return null;
                const done = day.ritualsDone.includes(r);
                const streak = world.ritualStreaks[r] ?? 0;
                return (
                  <button
                    key={r}
                    className="action-tile"
                    style={{ padding: '8px 11px', opacity: done ? 0.62 : 1 }}
                    onClick={() => onLog(r)}
                  >
                    <span className="emoji" style={{ fontSize: 16 }}>
                      {done ? '✓' : a.emoji}
                    </span>
                    <span className="t">
                      <span className="n" style={{ fontSize: 13 }}>
                        {a.name}
                      </span>
                    </span>
                    {streak > 0 && <span className="tiny" style={{ color: 'var(--warm)' }}>🔥{streak}</span>}
                  </button>
                );
              })}
            </div>
            <div className="hint" style={{ marginTop: 11 }}>
              Rituals are yours to choose — change them any time in Character.
            </div>
          </Card>

          <Card title="How life is going">
            <div className="stack" style={{ gap: 10 }}>
              <MeterRow
                label="Wellness"
                icon="🌿"
                ratio={world.scores.wellness / 100}
                value={`${world.scores.wellness}`}
                color="var(--good)"
              />
              <MeterRow
                label="Harmony"
                icon="🧭"
                ratio={world.scores.harmony / 100}
                value={`${world.scores.harmony}`}
                color="#b98bff"
              />
              <MeterRow
                label="Momentum"
                icon="🌊"
                ratio={world.scores.momentum / 100}
                value={`${world.scores.momentum}`}
                color="var(--accent)"
              />
              <MeterRow
                label="Tomorrow"
                icon="🌄"
                ratio={world.scores.outlook / 100}
                value={`${world.scores.outlook}`}
                color="var(--gold)"
              />
            </div>
            <div className="hint" style={{ marginTop: 12 }}>
              Wellness is {scoreWord(world.scores.wellness)}, harmony {scoreWord(world.scores.harmony)}.{' '}
              {day.sleepHours > 0
                ? `You slept ${round(day.sleepHours, 1)}h — tomorrow starts around ${world.scores.outlook} Energy.`
                : 'Logging sleep is the single biggest thing you can do for tomorrow’s numbers.'}
            </div>
          </Card>

          <Card title="Last fortnight" aside={<span className="tiny faint">{projectedDailyXp(world)} XP projected today</span>}>
            <Sparkbars values={last14.map((d) => d.xp)} color={world.rank.color} height={46} />
            <div className="row tiny faint" style={{ marginTop: 8 }}>
              <span>{last14[0] ? last14[0].date.slice(5) : ''}</span>
              <span className="spacer" />
              <span>today</span>
            </div>
          </Card>

          <div className="grid g2" style={{ gap: 12 }}>
            <Stat k="Attributes" v={world.attributeList.reduce((t, a) => t + a.level.level, 0)} s="combined levels" />
            <Stat k="Active days" v={world.activeDays} s={`${world.perfectDays} complete`} />
          </div>

          <Card title="Moved today">
            {Object.keys(day.attributeXp).length === 0 ? (
              <div className="hint">Nothing yet today.</div>
            ) : (
              <div className="stack" style={{ gap: 8 }}>
                {Object.entries(day.attributeXp)
                  .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
                  .slice(0, 6)
                  .map(([id, xp]) => {
                    const def = ATTRIBUTES[id as keyof typeof ATTRIBUTES];
                    const stat = world.attributes[def.id];
                    return (
                      <div key={id}>
                        <div className="row tiny" style={{ marginBottom: 4 }}>
                          <span style={{ color: def.color }}>
                            {def.emoji} {def.name}
                          </span>
                          <span className="spacer" />
                          <span className="faint num">+{round(xp ?? 0, 1)} today</span>
                        </div>
                        <Meter ratio={stat.level.ratio} color={def.color} className="thin" />
                      </div>
                    );
                  })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import {
  ACTIONS,
  CATEGORIES,
  CATEGORY_IDS,
  fmtAmount,
  fmtDuration,
  lastNDays,
  prettyDate,
  prettyDateLong,
  round,
  scoreWord,
  sum,
} from '../engine';
import { Constellation } from '../components/Constellation';
import { Heatmap } from '../components/Heatmap';
import { Card, Chip, Meter, Sparkbars, Stat } from '../components/ui';
import { useStore } from '../state/context';

export function Atlas() {
  const { world } = useStore();
  const [range, setRange] = useState<7 | 30 | 90>(30);

  const days = lastNDays(world.today, range).map((d) => world.daysByKey[d]).filter(Boolean);
  const totalXp = sum(days.map((d) => d.xp));
  const activeDays = days.filter((d) => d.entryCount > 0).length;
  const avgXp = activeDays ? Math.round(totalXp / activeDays) : 0;
  const sleepDays = days.filter((d) => d.sleepHours > 0);
  const avgSleep = sleepDays.length ? sum(sleepDays.map((d) => d.sleepHours)) / sleepDays.length : 0;

  const catUnits = CATEGORY_IDS.map((c) => ({
    cat: c,
    minutes: sum(
      days.flatMap((d) =>
        (world.entriesByDate[d.date] ?? [])
          .filter((e) => ACTIONS[e.actionId]?.category === c)
          .map((e) => (ACTIONS[e.actionId]?.unit === 'minutes' ? e.amount : 0)),
      ),
    ),
    entries: sum(
      days.map((d) => (world.entriesByDate[d.date] ?? []).filter((e) => ACTIONS[e.actionId]?.category === c).length),
    ),
  }));
  const maxCat = Math.max(1, ...catUnits.map((c) => c.entries));

  const topActions = [...world.actionList]
    .filter((a) => a.units > 0)
    .sort((a, b) => b.entryCount - a.entryCount)
    .slice(0, 10);

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="page-head">
        <h1>Atlas</h1>
        <p className="sub">
          The shape of your life, drawn from the record. No targets on this page — it is a mirror, not a
          scoreboard.
        </p>
      </div>

      <div className="grid g-hero">
        <Card title="Progress map" style={{ alignSelf: 'start' }}>
          <Constellation world={world} />
        </Card>

        <div className="stack" style={{ gap: 18 }}>
          <div className="row-wrap">
            {([7, 30, 90] as const).map((r) => (
              <Chip key={r} on={range === r} onClick={() => setRange(r)}>
                {r} days
              </Chip>
            ))}
          </div>

          <div className="grid g2" style={{ gap: 12 }}>
            <Stat k="XP earned" v={round(totalXp, 0)} s={`${avgXp} per active day`} />
            <Stat k="Active days" v={`${activeDays}/${range}`} s={`${Math.round((activeDays / range) * 100)}%`} />
            <Stat k="Avg sleep" v={avgSleep ? `${round(avgSleep, 1)}h` : '—'} s={`${sleepDays.length} nights logged`} />
            <Stat k="Best streak" v={world.streak.best} s={`now ${world.streak.current}`} />
          </div>

          <Card title="Where the hours went">
            <div className="stack" style={{ gap: 9 }}>
              {catUnits
                .sort((a, b) => b.entries - a.entries)
                .map((c) => (
                  <div key={c.cat}>
                    <div className="row tiny" style={{ marginBottom: 4 }}>
                      <span style={{ color: CATEGORIES[c.cat].color }}>
                        {CATEGORIES[c.cat].emoji} {CATEGORIES[c.cat].name}
                      </span>
                      <span className="spacer" />
                      <span className="faint num">
                        {c.minutes > 0 ? fmtDuration(c.minutes) : `${c.entries}×`}
                      </span>
                    </div>
                    <Meter ratio={c.entries / maxCat} color={CATEGORIES[c.cat].color} className="thin" />
                  </div>
                ))}
            </div>
          </Card>

          <Card title="Scores">
            <div className="hint" style={{ marginBottom: 12 }}>
              Wellness is {scoreWord(world.scores.wellness)}. Harmony — how evenly your week is spread across
              the nine attributes — is {scoreWord(world.scores.harmony)}.
            </div>
            <div className="grid g2" style={{ gap: 12 }}>
              <Stat k="Wellness" v={world.scores.wellness} color="var(--good)" />
              <Stat k="Harmony" v={world.scores.harmony} color="#b98bff" />
              <Stat k="Momentum" v={world.scores.momentum} color="var(--accent)" />
              <Stat k="Tomorrow" v={world.scores.outlook} color="var(--gold)" />
            </div>
          </Card>
        </div>
      </div>

      <Card title="Every day since you started" aside={<span className="tiny faint">{world.activeDays} active days</span>}>
        <Heatmap world={world} />
        <div className="row tiny faint" style={{ marginTop: 11, gap: 7 }}>
          <span>quiet</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <span
              key={l}
              style={{
                width: 11,
                height: 11,
                borderRadius: 3,
                display: 'inline-block',
                background:
                  l === 0
                    ? 'rgba(255,255,255,0.055)'
                    : `color-mix(in oklab, var(--accent) ${l * 24}%, transparent)`,
              }}
            />
          ))}
          <span>full</span>
          <span className="spacer" />
          <span>Gaps are just gaps. They are not held against you anywhere in this app.</span>
        </div>
      </Card>

      <div className="grid g2">
        <Card title="XP, last 30 days">
          <Sparkbars values={world.days.slice(-30).map((d) => d.xp)} height={92} color={world.rank.color} />
          <div className="row tiny faint" style={{ marginTop: 8 }}>
            <span>{world.days.slice(-30)[0]?.date.slice(5)}</span>
            <span className="spacer" />
            <span>{prettyDate(world.today)}</span>
          </div>
        </Card>

        <Card title="Most-lived actions">
          <div className="stack" style={{ gap: 8 }}>
            {topActions.map((a) => (
              <div className="row" key={a.def.id} style={{ gap: 9 }}>
                <span>{a.def.emoji}</span>
                <span className="small">{a.def.name}</span>
                <span className="spacer" />
                <span className="tiny faint num">
                  {fmtAmount(a.def.unit, a.units)} ·{' '}
                  {a.days}d
                </span>
                {a.mastery.tier > 0 && (
                  <span className="tiny" style={{ color: 'var(--gold)' }}>
                    {a.mastery.name}
                  </span>
                )}
              </div>
            ))}
            {!topActions.length && <div className="hint">Nothing logged yet.</div>}
          </div>
        </Card>
      </div>

      <Card title="Recent days">
        <div className="stack" style={{ gap: 8 }}>
          {[...world.days]
            .slice(-14)
            .reverse()
            .map((d) => (
              <div className="row" key={d.date} style={{ gap: 10 }}>
                <span className="small" style={{ width: 108 }}>
                  {prettyDateLong(d.date).split(',')[0]}
                  <span className="faint"> {d.date.slice(5)}</span>
                </span>
                <Meter ratio={Math.min(1, d.xp / 320)} color={d.complete ? 'var(--good)' : 'var(--accent)'} />
                <span className="tiny faint num" style={{ width: 90, textAlign: 'right' }}>
                  {Math.round(d.xp)} XP · {d.entryCount}×
                </span>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}

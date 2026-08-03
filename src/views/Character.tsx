import { useState } from 'react';
import {
  ACTION_LIST,
  CATEGORIES,
  MASTERY_NAMES,
  RANKS,
  TITLES,
  fmtAmount,
  prettyDate,
  round,
} from '../engine';
import { Card, Chip, Meter, Sheet } from '../components/ui';
import { useStore } from '../state/context';

export function Character() {
  const { world, save, chooseTitle, rename } = useStore();
  const [editRituals, setEditRituals] = useState(false);
  const [editName, setEditName] = useState(false);
  const [draft, setDraft] = useState(save.profile.name);

  const earnedTitles = TITLES.filter((t) => save.unlocked.titles[t.id]);

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="page-head">
        <h1>Character</h1>
        <p className="sub">
          Nine attributes, each grown by a different kind of real-life hour. This page is the answer to “what
          am I actually becoming?”
        </p>
      </div>

      {/* ------------------------------------------------------- identity */}
      <Card>
        <div className="row" style={{ gap: 16, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 62,
              height: 62,
              borderRadius: 20,
              display: 'grid',
              placeItems: 'center',
              fontSize: 28,
              background: `color-mix(in oklab, ${world.rank.color} 18%, transparent)`,
              border: `1px solid color-mix(in oklab, ${world.rank.color} 40%, transparent)`,
            }}
          >
            {save.profile.sigil}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            {editName ? (
              <div className="row" style={{ gap: 8 }}>
                <input className="search" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={24} />
                <button
                  className="btn sm primary"
                  onClick={() => {
                    rename(draft);
                    setEditName(false);
                  }}
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="hero-name" onClick={() => setEditName(true)} style={{ cursor: 'text' }}>
                {save.profile.name}
              </div>
            )}
            <div className="row-wrap" style={{ marginTop: 8 }}>
              <Chip gold>
                {world.rank.name} · Level {world.level.level}
              </Chip>
              <Chip>{round(world.totalXp, 0)} total XP</Chip>
              <Chip>{world.activeDays} days lived here</Chip>
            </div>
          </div>
        </div>

        <div className="divider" style={{ margin: '18px 0 14px' }} />

        <div className="card-title">Titles</div>
        {earnedTitles.length === 0 ? (
          <div className="hint">No titles yet. They arrive on their own as you go.</div>
        ) : (
          <div className="row-wrap">
            <Chip on={!save.profile.activeTitle} onClick={() => chooseTitle(null)}>
              None
            </Chip>
            {earnedTitles.map((t) => (
              <Chip key={t.id} on={save.profile.activeTitle === t.id} onClick={() => chooseTitle(t.id)} title={t.blurb}>
                {t.name}
              </Chip>
            ))}
          </div>
        )}
        <div className="hint" style={{ marginTop: 10 }}>
          {earnedTitles.length} of {TITLES.length} titles earned.
        </div>
      </Card>

      {/* ----------------------------------------------------- attributes */}
      <div className="grid g3">
        {world.attributeList.map((a) => (
          <Card key={a.def.id} className="tight">
            <div className="row" style={{ gap: 9 }}>
              <span style={{ fontSize: 20 }}>{a.def.emoji}</span>
              <div style={{ minWidth: 0 }}>
                <div className="strong" style={{ fontSize: 14.5 }}>
                  {a.def.name}
                </div>
                <div className="tiny faint">{a.def.blurb}</div>
              </div>
              <span className="spacer" />
              <div style={{ textAlign: 'right' }}>
                <div className="strong num" style={{ fontSize: 20, color: a.def.color }}>
                  {a.level.level}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 11 }}>
              <Meter ratio={a.level.ratio} color={a.def.color} />
              <div className="row tiny faint" style={{ marginTop: 6 }}>
                <span className="num">
                  {round(a.level.into, 0)} / {a.level.span}
                </span>
                <span className="spacer" />
                <span className="num">+{round(a.weekXp, 0)} this week</span>
              </div>
            </div>
            <div className="hint" style={{ marginTop: 9 }}>
              {a.def.governs}
            </div>
            {a.lastActive && a.lastActive !== world.today && (
              <div className="tiny faint" style={{ marginTop: 7 }}>
                Last touched {prettyDate(a.lastActive)}.
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* --------------------------------------------------------- ranks */}
      <Card title="The road so far">
        <div className="row-wrap" style={{ gap: 8 }}>
          {RANKS.map((r) => {
            const reached = world.level.level >= r.from;
            return (
              <div
                key={r.name}
                className="tile"
                style={{
                  flex: '1 1 130px',
                  opacity: reached ? 1 : 0.4,
                  borderColor: reached ? `color-mix(in oklab, ${r.color} 40%, transparent)` : undefined,
                }}
                title={r.blurb}
              >
                <div className="n" style={{ color: reached ? r.color : undefined, marginTop: 0 }}>
                  {r.name}
                </div>
                <div className="b">Level {r.from}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ------------------------------------------------------- rituals */}
      <Card
        title="Rituals"
        aside={
          <button className="btn sm" onClick={() => setEditRituals(true)}>
            Change
          </button>
        }
      >
        <div className="hint" style={{ marginBottom: 12 }}>
          The handful of actions that define a complete day for you. They drive day completion, ritual streaks
          and several quests — so choose things you genuinely want to be true of your days, not things you think
          you should want.
        </div>
        <div className="row-wrap">
          {save.rituals.map((id) => {
            const stat = world.actions[id];
            if (!stat) return null;
            return (
              <Chip key={id} on={world.todaySummary.ritualsDone.includes(id)}>
                {stat.def.emoji} {stat.def.name}
                {stat.streak > 0 && <span style={{ color: 'var(--warm)' }}> 🔥{stat.streak}</span>}
              </Chip>
            );
          })}
        </div>
      </Card>

      {/* ------------------------------------------------------ masteries */}
      <Card title="Masteries">
        <div className="hint" style={{ marginBottom: 14 }}>
          Every action has its own long ladder. Each tier permanently raises what that action is worth — this is
          how doing something for years compounds instead of flattening out.
        </div>
        <div className="grid g2" style={{ gap: 10 }}>
          {world.actionList
            .filter((a) => a.units > 0)
            .sort((a, b) => b.mastery.tier - a.mastery.tier || b.mastery.ratio - a.mastery.ratio)
            .slice(0, 12)
            .map((a) => (
              <div key={a.def.id} className="card tight" style={{ boxShadow: 'none' }}>
                <div className="row" style={{ gap: 8 }}>
                  <span>{a.def.emoji}</span>
                  <span className="small strong">{a.def.name}</span>
                  <span className="spacer" />
                  <span className="tiny" style={{ color: 'var(--gold)' }}>
                    {a.mastery.name}
                  </span>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Meter ratio={a.mastery.ratio} color="var(--gold)" className="thin" />
                </div>
                <div className="row tiny faint" style={{ marginTop: 6 }}>
                  <span>
                    {fmtAmount(a.def.unit, a.units)} ·{' '}
                    {a.days} days
                  </span>
                  <span className="spacer" />
                  <span>+{Math.round((a.mastery.bonus - 1) * 100)}%</span>
                </div>
              </div>
            ))}
        </div>
        {world.actionList.every((a) => a.units === 0) && (
          <div className="hint">Nothing logged yet — masteries appear as you use each action.</div>
        )}
        <div className="row-wrap" style={{ marginTop: 14 }}>
          {MASTERY_NAMES.map((n, i) => (
            <Chip key={n}>
              {i === 0 ? '' : `${i}× `}
              {n}
            </Chip>
          ))}
        </div>
      </Card>

      {editRituals && <RitualEditor onClose={() => setEditRituals(false)} />}
    </div>
  );
}

/* --------------------------------------------------------- ritual editor */

function RitualEditor({ onClose }: { onClose: () => void }) {
  const { save, rituals } = useStore();
  const [picked, setPicked] = useState<string[]>(save.rituals);

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 8 ? p : [...p, id]));

  return (
    <Sheet
      title="Choose your rituals"
      subtitle="Between three and eight. These define what a complete day means for you."
      emoji="⭑"
      onClose={onClose}
      footer={
        <button
          className="btn primary wide"
          disabled={picked.length < 2}
          onClick={() => {
            rituals(picked);
            onClose();
          }}
        >
          Save {picked.length} ritual{picked.length === 1 ? '' : 's'}
        </button>
      }
    >
      <div className="stack" style={{ gap: 16 }}>
        {Object.values(CATEGORIES).map((cat) => {
          const items = ACTION_LIST.filter((a) => a.category === cat.id);
          return (
            <div key={cat.id}>
              <div className="card-title" style={{ marginBottom: 8, color: cat.color }}>
                {cat.emoji} {cat.name}
              </div>
              <div className="row-wrap">
                {items.map((a) => (
                  <Chip key={a.id} on={picked.includes(a.id)} onClick={() => toggle(a.id)}>
                    {a.emoji} {a.name}
                  </Chip>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}

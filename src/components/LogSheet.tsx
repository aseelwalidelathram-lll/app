import { useMemo, useState } from 'react';
import {
  ACTION_LIST,
  ATTRIBUTES,
  CATEGORIES,
  CATEGORY_IDS,
  UNITS,
  VITALS,
  fmtAmount,
  fmtDuration,
  previewAction,
  round,
} from '../engine';
import type { ActionDef, CategoryId } from '../engine';
import { useStore } from '../state/context';
import { Chip, Meter, Sheet } from './ui';

export function LogSheet({ initialAction, onClose }: { initialAction?: string | null; onClose: () => void }) {
  const { save, world } = useStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CategoryId | 'all' | 'rituals'>('all');
  const [chosen, setChosen] = useState<ActionDef | null>(
    initialAction ? ACTION_LIST.find((a) => a.id === initialAction) ?? null : null,
  );

  if (chosen) {
    return <LogDetail action={chosen} onBack={() => setChosen(null)} onClose={onClose} />;
  }

  const q = query.trim().toLowerCase();
  const matches = ACTION_LIST.filter((a) => {
    if (filter === 'rituals' && !save.rituals.includes(a.id)) return false;
    if (filter !== 'all' && filter !== 'rituals' && a.category !== filter) return false;
    if (!q) return true;
    return (
      a.name.toLowerCase().includes(q) ||
      a.blurb.toLowerCase().includes(q) ||
      a.tags.some((t) => t.includes(q)) ||
      CATEGORIES[a.category].name.toLowerCase().includes(q)
    );
  });

  const grouped = CATEGORY_IDS.map((c) => ({ cat: c, items: matches.filter((a) => a.category === c) })).filter(
    (g) => g.items.length,
  );

  return (
    <Sheet
      title="What did you do?"
      subtitle="Everything here moves at least three other things."
      emoji="✦"
      onClose={onClose}
    >
      <input
        className="search"
        placeholder="Search actions…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />

      <div className="row-wrap" style={{ margin: '13px 0 16px' }}>
        <Chip on={filter === 'all'} onClick={() => setFilter('all')}>
          Everything
        </Chip>
        <Chip on={filter === 'rituals'} onClick={() => setFilter('rituals')}>
          ⭑ Rituals
        </Chip>
        {CATEGORY_IDS.map((c) => (
          <Chip key={c} on={filter === c} onClick={() => setFilter(c)}>
            {CATEGORIES[c].emoji} {CATEGORIES[c].name}
          </Chip>
        ))}
      </div>

      <div className="stack" style={{ gap: 18 }}>
        {grouped.map(({ cat, items }) => (
          <div key={cat}>
            <div className="card-title" style={{ marginBottom: 9, color: CATEGORIES[cat].color }}>
              {CATEGORIES[cat].emoji} {CATEGORIES[cat].name}
            </div>
            <div className="grid g2" style={{ gap: 8 }}>
              {items.map((a) => {
                const stat = world.actions[a.id];
                return (
                  <button key={a.id} className="action-tile" onClick={() => setChosen(a)}>
                    <span className="emoji">{a.emoji}</span>
                    <span className="t">
                      <span className="n">
                        {a.name}
                        {save.rituals.includes(a.id) && <span style={{ color: 'var(--gold)' }}> ⭑</span>}
                      </span>
                      <span className="d">
                        {stat.todayUnits > 0
                          ? `${fmtAmount(a.unit, stat.todayUnits)} today`
                          : stat.mastery.tier > 0
                            ? `${stat.mastery.name} · ${fmtAmount(a.unit, stat.units)} logged`
                            : a.blurb}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {!grouped.length && <div className="empty">Nothing matches “{query}”.</div>}
      </div>
    </Sheet>
  );
}

/* ---------------------------------------------------------------- detail */

function LogDetail({ action, onBack, onClose }: { action: ActionDef; onBack: () => void; onClose: () => void }) {
  const { save, world, log } = useStore();
  const unit = UNITS[action.unit];
  const stat = world.actions[action.id];
  const [amount, setAmount] = useState(() => {
    const typical = stat.typicalPerDay;
    if (!typical) return action.quickAmount;
    const step = unit.step;
    return Math.max(step, Math.round(typical / step) * step);
  });
  const [note, setNote] = useState('');

  const preview = useMemo(
    () => previewAction(save, action.id, amount),
    [save, action.id, amount],
  );

  const bump = (delta: number) => setAmount((a) => Math.max(unit.step, round(a + delta, 2)));

  const label =
    action.unit === 'minutes' ? fmtDuration(amount) : `${round(amount, 1)} ${amount === 1 ? unit.singular : unit.plural}`;

  return (
    <Sheet
      title={action.name}
      subtitle={action.blurb}
      emoji={action.emoji}
      onClose={onClose}
      footer={
        <div className="row" style={{ gap: 10 }}>
          <button className="btn ghost" onClick={onBack}>
            ← Back
          </button>
          <button
            className="btn primary"
            style={{ flex: 1 }}
            onClick={() => {
              log(action.id, amount, { note });
              onClose();
            }}
          >
            Log {label} · +{preview.xp} XP
          </button>
        </div>
      }
    >
      <div className="stepper">
        <button onClick={() => bump(-unit.step)} aria-label="Less">
          −
        </button>
        <div className="amount">
          <div className="v">{action.unit === 'minutes' ? amount : round(amount, 1)}</div>
          <div className="u">{action.unit === 'minutes' ? 'minutes' : unit.label}</div>
        </div>
        <button onClick={() => bump(unit.step)} aria-label="More">
          +
        </button>
      </div>

      <div className="row-wrap" style={{ marginTop: 11 }}>
        {unit.presets.map((p) => (
          <Chip key={p} on={amount === p} onClick={() => setAmount(p)}>
            {action.unit === 'minutes' ? fmtDuration(p) : p}
          </Chip>
        ))}
      </div>

      {/* The whole point of the app, made visible before you commit. */}
      <div className="card-title" style={{ marginTop: 22 }}>
        What this touches
      </div>
      <div className="preview">
        <span className="chip gold">＋{preview.xp} XP</span>
        {Object.entries(preview.attributeXp)
          .filter(([, v]) => (v ?? 0) >= 0.5)
          .map(([k, v]) => (
            <span key={k} className="chip" style={{ color: ATTRIBUTES[k as keyof typeof ATTRIBUTES].color }}>
              {ATTRIBUTES[k as keyof typeof ATTRIBUTES].emoji} +{round(v ?? 0, 1)}{' '}
              {ATTRIBUTES[k as keyof typeof ATTRIBUTES].name}
            </span>
          ))}
        {Object.entries(preview.vitals).map(([k, v]) => (
          <span key={k} className="chip" style={{ color: VITALS[k as keyof typeof VITALS].color }}>
            {VITALS[k as keyof typeof VITALS].emoji} {(v ?? 0) > 0 ? '+' : ''}
            {v} {VITALS[k as keyof typeof VITALS].name}
          </span>
        ))}
        {preview.questsTouched.map((q) => (
          <span key={q.id} className="chip">
            {q.emoji} {q.to >= q.target ? 'completes' : 'advances'} · {q.title}
          </span>
        ))}
      </div>

      <div className="grid g2" style={{ marginTop: 14, gap: 12 }}>
        <div className="card tight" style={{ boxShadow: 'none' }}>
          <div className="tiny faint" style={{ marginBottom: 7 }}>
            MULTIPLIERS
          </div>
          <div className="stack" style={{ gap: 5 }}>
            <MultiplierLine
              name={`${VITALS[action.keyVital].emoji} ${VITALS[action.keyVital].name}`}
              value={preview.bonuses.vital}
              note={`${Math.round(world.vitals[action.keyVital])}/100`}
            />
            <MultiplierLine name="🎖️ Mastery" value={preview.bonuses.mastery} note={stat.mastery.name} />
            <MultiplierLine name="🧭 Harmony" value={preview.bonuses.harmony} note="week's breadth" />
            <div className="divider" />
            <MultiplierLine name="Total" value={preview.bonuses.total} strong />
          </div>
        </div>

        <div className="card tight" style={{ boxShadow: 'none' }}>
          <div className="tiny faint" style={{ marginBottom: 7 }}>
            MASTERY · {stat.mastery.name.toUpperCase()}
          </div>
          <Meter ratio={stat.mastery.ratio} color="var(--gold)" />
          <div className="tiny faint" style={{ marginTop: 7 }}>
            {preview.masteryNext
              ? `${fmtAmount(action.unit, preview.masteryNext.remaining)} more to the next tier`
              : 'Carried as far as it goes.'}
          </div>
          {stat.streak > 0 && (
            <div className="tiny" style={{ marginTop: 8, color: 'var(--warm)' }}>
              🔥 {stat.streak}-day streak
              {stat.todayUnits === 0 ? ' — this keeps it alive' : ''}
            </div>
          )}
        </div>
      </div>

      {preview.softCapped && (
        <div className="hint" style={{ marginTop: 12 }}>
          You are past today's soft cap for this ({action.softCap} {unit.plural}). It still counts — just gently
          less. The app would rather you did something else with the hour.
        </div>
      )}

      <input
        className="search"
        style={{ marginTop: 14 }}
        placeholder="Add a note (optional)…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={140}
      />
    </Sheet>
  );
}

function MultiplierLine({ name, value, note, strong }: { name: string; value: number; note?: string; strong?: boolean }) {
  const pct = Math.round((value - 1) * 100);
  return (
    <div className="row" style={{ fontSize: 12.5 }}>
      <span className={strong ? 'strong' : 'dim'}>{name}</span>
      <span className="spacer" />
      {note && <span className="tiny faint">{note}</span>}
      <span
        className="num"
        style={{ color: pct > 0 ? 'var(--good)' : pct < 0 ? 'var(--dim)' : 'var(--faint)', width: 46, textAlign: 'right' }}
      >
        {pct > 0 ? '+' : ''}
        {pct}%
      </span>
    </div>
  );
}

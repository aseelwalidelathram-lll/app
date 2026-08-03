import { useState } from 'react';
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_GROUPS,
  COLLECTIONS,
  TIER_COLOR,
  TIER_NAME,
  prettyDate,
  round,
} from '../engine';
import type { UnlockDef } from '../engine';
import { Card, Chip, Meter } from '../components/ui';
import { useStore } from '../state/context';

export function Almanac() {
  const { save } = useStore();
  const [tab, setTab] = useState<'achievements' | 'collections' | 'chronicle'>('achievements');

  const unlockedCount = Object.keys(save.unlocked.achievements).length;
  const cardCount = Object.keys(save.unlocked.cards).length;
  const totalCards = COLLECTIONS.reduce((t, c) => t + c.cards.length, 0);

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="page-head">
        <h1>Almanac</h1>
        <p className="sub">
          Everything you have found, and everything still out there. Locked entries show their real progress —
          nothing here is a mystery box.
        </p>
      </div>

      <div className="row-wrap">
        <Chip on={tab === 'achievements'} onClick={() => setTab('achievements')}>
          🏅 Achievements · {unlockedCount}/{ACHIEVEMENTS.length}
        </Chip>
        <Chip on={tab === 'collections'} onClick={() => setTab('collections')}>
          🗃️ Collections · {cardCount}/{totalCards}
        </Chip>
        <Chip on={tab === 'chronicle'} onClick={() => setTab('chronicle')}>
          📜 Chronicle
        </Chip>
      </div>

      {tab === 'achievements' && <Achievements />}
      {tab === 'collections' && <Collections />}
      {tab === 'chronicle' && <Chronicle />}
    </div>
  );
}

/* --------------------------------------------------------- achievements */

function Achievements() {
  const { world, save } = useStore();
  const [showLocked, setShowLocked] = useState(true);

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="row-wrap">
        <Chip on={showLocked} onClick={() => setShowLocked(!showLocked)}>
          {showLocked ? 'Showing everything' : 'Showing earned only'}
        </Chip>
      </div>

      {ACHIEVEMENT_GROUPS.map((group) => {
        const items = ACHIEVEMENTS.filter((a) => a.group === group).filter(
          (a) => showLocked || save.unlocked.achievements[a.id],
        );
        if (!items.length) return null;
        const got = items.filter((a) => save.unlocked.achievements[a.id]).length;

        return (
          <Card
            key={group}
            title={group}
            aside={
              <span className="tiny faint num">
                {got}/{items.length}
              </span>
            }
          >
            <div className="grid g4" style={{ gap: 10 }}>
              {items.map((a) => (
                <UnlockTile key={a.id} def={a} unlockedOn={save.unlocked.achievements[a.id]} value={world.metric(a.metric)} />
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function UnlockTile({ def, unlockedOn, value }: { def: UnlockDef; unlockedOn?: string; value: number }) {
  const got = Boolean(unlockedOn);
  const ratio = Math.min(1, value / def.target);
  const hidden = def.secret && !got && ratio < 0.35;

  return (
    <div
      className={`tile ${got ? 'got' : 'locked'}`}
      style={{ ['--tier' as string]: TIER_COLOR[def.tier] }}
      title={got ? `Earned ${prettyDate(unlockedOn!)}` : `${round(value, 0)} / ${def.target}`}
    >
      <div className="g">{hidden ? '❔' : def.emoji}</div>
      <div className="n">{hidden ? 'Something undiscovered' : def.name}</div>
      <div className="b">{hidden ? 'Keep going and it will show itself.' : def.blurb}</div>
      {!got && !hidden && (
        <div style={{ marginTop: 9 }}>
          <Meter ratio={ratio} color={TIER_COLOR[def.tier]} className="thin" />
          <div className="tiny faint num" style={{ marginTop: 5 }}>
            {round(value, 0)} / {def.target}
          </div>
        </div>
      )}
      {got && (
        <div className="tiny" style={{ marginTop: 8, color: TIER_COLOR[def.tier] }}>
          {TIER_NAME[def.tier]} · {prettyDate(unlockedOn!)}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------- collections */

function Collections() {
  const { world, save } = useStore();

  return (
    <div className="stack" style={{ gap: 18 }}>
      {COLLECTIONS.map((col) => {
        const got = col.cards.filter((c) => save.unlocked.cards[c.id]).length;
        const complete = got === col.cards.length;
        return (
          <Card
            key={col.id}
            title={
              <>
                {col.emoji} {col.name}
              </>
            }
            aside={
              <span className="tiny num" style={{ color: complete ? col.color : 'var(--faint)' }}>
                {got}/{col.cards.length}
                {complete ? ' · complete' : ''}
              </span>
            }
            style={complete ? { borderColor: `color-mix(in oklab, ${col.color} 35%, transparent)` } : undefined}
          >
            <div className="hint" style={{ marginBottom: 13 }}>
              {col.blurb}
            </div>
            <div className="grid g4" style={{ gap: 10 }}>
              {col.cards.map((c) => (
                <UnlockTile key={c.id} def={c} unlockedOn={save.unlocked.cards[c.id]} value={world.metric(c.metric)} />
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------- chronicle */

function Chronicle() {
  const { save } = useStore();
  const entries = [...save.ledger].reverse().slice(0, 120);

  const sourceLabel: Record<string, string> = {
    quest: 'Quest',
    achievement: 'Achievement',
    mission: 'Mission',
    challenge: 'Challenge',
    card: 'Collection',
    title: 'Title',
  };

  return (
    <Card title="Chronicle" aside={<span className="tiny faint">{save.ledger.length} entries</span>}>
      <div className="hint" style={{ marginBottom: 14 }}>
        Every reward this world has ever paid out, and what earned it. Your total XP is exactly the sum of your
        logged actions plus this list — nothing is invented.
      </div>
      {entries.length === 0 ? (
        <div className="empty">
          <span className="g">📜</span>
          Nothing recorded yet.
        </div>
      ) : (
        <div>
          {entries.map((l) => (
            <div className="entry" key={l.id}>
              <span className="e">{l.emoji}</span>
              <div style={{ minWidth: 0 }}>
                <div className="n">{l.label}</div>
                <div className="m">
                  {sourceLabel[l.source] ?? l.source} · {prettyDate(l.date)}
                </div>
              </div>
              <span className="x">
                +{l.xp} XP{l.sparks ? ` · +${l.sparks} ✦` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

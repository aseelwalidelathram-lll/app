import { useEffect, useRef, useState } from 'react';
import { COSMETICS_BY_ID, isEvening, seasonFor } from './engine';
import { LogSheet } from './components/LogSheet';
import { Toasts } from './components/Toasts';
import { useStore } from './state/context';
import { Almanac } from './views/Almanac';
import { Atlas } from './views/Atlas';
import { Character } from './views/Character';
import { EveningReview, MorningBrief } from './views/DailyLoop';
import { Hobbies } from './views/Hobbies';
import { Onboarding } from './views/Onboarding';
import { Quests } from './views/Quests';
import { Today } from './views/Today';
import { Workshop } from './views/Workshop';

type ViewId = 'today' | 'quests' | 'hobbies' | 'character' | 'almanac' | 'atlas' | 'workshop';

const NAV: { id: ViewId; label: string; glyph: string }[] = [
  { id: 'today', label: 'Today', glyph: '🌅' },
  { id: 'quests', label: 'Quests', glyph: '📜' },
  { id: 'hobbies', label: 'Pursuits', glyph: '🧶' },
  { id: 'character', label: 'Character', glyph: '🧭' },
  { id: 'almanac', label: 'Almanac', glyph: '🏅' },
  { id: 'atlas', label: 'Atlas', glyph: '🗺️' },
  { id: 'workshop', label: 'Workshop', glyph: '✦' },
];

export default function App() {
  const { save, world } = useStore();
  const [view, setView] = useState<ViewId>('today');
  const [logging, setLogging] = useState<{ open: boolean; action?: string | null }>({ open: false });
  const [brief, setBrief] = useState<'morning' | 'evening' | null>(null);

  /* The active cosmetic drives the accent the whole stylesheet is built on. */
  useEffect(() => {
    const theme = COSMETICS_BY_ID[save.profile.theme];
    const season = seasonFor(new Date());
    const root = document.documentElement;
    root.style.setProperty('--accent', theme?.accent ?? '#8ab4ff');
    root.style.setProperty('--accent-soft', theme?.accentSoft ?? '#5a7fd6');
    // Seasons tint the gold, so the world looks slightly different across the year.
    root.style.setProperty('--gold', season.accent);
    document.body.classList.toggle('reduced-motion', save.settings.reducedMotion);
  }, [save.profile.theme, save.settings.reducedMotion]);

  /*
   * The daily loop: each half offered once a day, and at most one of them
   * auto-opens per visit — dismissing the morning brief should not immediately
   * summon the evening one. Both stay reachable by hand.
   */
  const autoOpened = useRef(false);
  useEffect(() => {
    if (!save.seen.onboarded || autoOpened.current) return;
    if (save.seen.lastMorningBrief !== world.today) {
      autoOpened.current = true;
      setBrief('morning');
    } else if (isEvening(world) && save.seen.lastEveningReview !== world.today && world.todayEntries.length > 0) {
      autoOpened.current = true;
      setBrief('evening');
    }
  }, [save.seen.onboarded, save.seen.lastMorningBrief, save.seen.lastEveningReview, world]);

  /* Keyboard: "L" logs, digits switch views. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        setLogging({ open: true });
      }
      const idx = Number(e.key);
      if (idx >= 1 && idx <= NAV.length) setView(NAV[idx - 1].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!save.seen.onboarded) return <Onboarding />;

  const openLog = (action?: string) => setLogging({ open: true, action: action ?? null });
  const questsLeft = world.quests.daily.filter((q) => !q.complete).length;

  return (
    <div className="app">
      <nav className="rail">
        <div className="brand">
          <div className="brand-mark">✦</div>
          <div>
            <div className="brand-name">Lumen</div>
            <div className="brand-sub">a life, played</div>
          </div>
        </div>

        {NAV.map((n) => (
          <button key={n.id} className={`navlink ${view === n.id ? 'active' : ''}`} onClick={() => setView(n.id)}>
            <span className="glyph">{n.glyph}</span>
            {n.label}
            {n.id === 'quests' && questsLeft > 0 && <span className="badge hot">{questsLeft}</span>}
            {n.id === 'workshop' && world.sparks > 0 && <span className="badge">{world.sparks}✦</span>}
          </button>
        ))}

        <div className="rail-foot">
          <div className="row tiny faint">
            <span>🔥 {world.streak.current}d</span>
            <span className="spacer" />
            <span>Lv {world.level.level}</span>
          </div>
          <div className="meter thin">
            <i style={{ width: `${world.level.ratio * 100}%`, background: world.rank.color }} />
          </div>
          <button
            className="navlink"
            style={{ padding: '7px 0' }}
            onClick={() => setBrief(isEvening(world) ? 'evening' : 'morning')}
          >
            <span className="glyph">{isEvening(world) ? '🌙' : '🌄'}</span>
            <span style={{ fontSize: 12.5 }}>{isEvening(world) ? 'Close the day' : 'Today’s brief'}</span>
          </button>
        </div>
      </nav>

      <main className="main">
        {view === 'today' && <Today onLog={openLog} />}
        {view === 'quests' && <Quests onLog={openLog} />}
        {view === 'hobbies' && <Hobbies onLog={openLog} />}
        {view === 'character' && <Character />}
        {view === 'almanac' && <Almanac />}
        {view === 'atlas' && <Atlas />}
        {view === 'workshop' && <Workshop />}
      </main>

      <button className="fab" onClick={() => openLog()} title="Log an action (L)">
        ＋ Log
      </button>

      <nav className="tabbar">
        {NAV.map((n) => (
          <button key={n.id} className={view === n.id ? 'active' : ''} onClick={() => setView(n.id)}>
            <span className="glyph">{n.glyph}</span>
            {n.label}
          </button>
        ))}
      </nav>

      {logging.open && <LogSheet initialAction={logging.action} onClose={() => setLogging({ open: false })} />}
      {brief === 'morning' && <MorningBrief onClose={() => setBrief(null)} onLog={openLog} />}
      {brief === 'evening' && <EveningReview onClose={() => setBrief(null)} />}

      <Toasts />
    </div>
  );
}

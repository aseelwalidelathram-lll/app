import { useEffect } from 'react';
import { useStore } from '../state/context';

/**
 * The cascade, made visible. Events arrive in the order the engine caused
 * them, so a single logged action reads like a small chain reaction.
 */
export function Toasts() {
  const { events, dismissEvent } = useStore();

  useEffect(() => {
    if (!events.length) return;
    const timers = events.map((e) =>
      window.setTimeout(() => dismissEvent(e.id), e.weight === 3 ? 7000 : e.weight === 2 ? 5200 : 3600),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [events, dismissEvent]);

  if (!events.length) return null;

  return (
    <div className="toasts" role="status" aria-live="polite">
      {events.slice(-6).map((e) => (
        <div
          key={e.id}
          className={`toast w${e.weight}`}
          onClick={() => dismissEvent(e.id)}
          style={e.color && e.weight > 1 ? { borderColor: `color-mix(in oklab, ${e.color} 55%, transparent)` } : undefined}
        >
          <span className="e">{e.emoji ?? '✦'}</span>
          <div style={{ minWidth: 0 }}>
            <div className="t" style={e.color ? { color: e.color } : undefined}>
              {e.title}
            </div>
            {e.detail && <div className="d">{e.detail}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

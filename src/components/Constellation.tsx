import { useState } from 'react';
import type { AttributeStat, World } from '../engine/derive';
import { round } from '../engine';

/**
 * The progress map: your character at the centre, the nine attributes as
 * stars around it. Stars grow with level and brighten with recent activity,
 * so a glance tells you which parts of your life are lit and which are quiet.
 */
export function Constellation({ world, size = 420 }: { world: World; size?: number }) {
  const [hover, setHover] = useState<AttributeStat | null>(null);
  const stats = world.attributeList;
  const cx = size / 2;
  const cy = size / 2;
  const orbit = size * 0.345;

  const points = stats.map((s, i) => {
    const angle = (i / stats.length) * Math.PI * 2 - Math.PI / 2;
    return {
      stat: s,
      x: cx + Math.cos(angle) * orbit,
      y: cy + Math.sin(angle) * orbit,
      r: 7 + Math.min(19, s.level.level * 1.15),
      lit: s.weekXp > 0,
      intensity: Math.min(1, s.share * 3.4),
    };
  });

  const focus = hover ?? null;

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ display: 'block', maxHeight: 520 }} role="img" aria-label="Progress map">
        <defs>
          <radialGradient id="coreGlow">
            <stop offset="0%" stopColor={world.rank.color} stopOpacity="0.55" />
            <stop offset="100%" stopColor={world.rank.color} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* faint orbit */}
        <circle cx={cx} cy={cy} r={orbit} fill="none" stroke="rgba(255,255,255,0.055)" strokeDasharray="2 7" />
        <circle cx={cx} cy={cy} r={orbit * 0.6} fill="none" stroke="rgba(255,255,255,0.03)" />

        {/* links between neighbouring stars — the life holds together */}
        {points.map((p, i) => {
          const next = points[(i + 1) % points.length];
          const strength = Math.min(p.intensity, next.intensity);
          return (
            <line
              key={`edge-${i}`}
              x1={p.x}
              y1={p.y}
              x2={next.x}
              y2={next.y}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={0.6 + strength * 1.6}
              opacity={0.25 + strength * 0.6}
            />
          );
        })}

        {/* spokes */}
        {points.map((p, i) => (
          <line
            key={`spoke-${i}`}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke={p.stat.def.color}
            strokeWidth={0.5 + p.intensity * 2.2}
            opacity={p.lit ? 0.18 + p.intensity * 0.4 : 0.07}
          />
        ))}

        <circle cx={cx} cy={cy} r={78} fill="url(#coreGlow)" />

        {/* the character */}
        <circle cx={cx} cy={cy} r={30} fill="rgba(10,14,26,0.9)" stroke={world.rank.color} strokeWidth={1.6} />
        <text x={cx} y={cy - 3} textAnchor="middle" fontSize="19" fill="#fff" fontWeight="650">
          {world.level.level}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.55)" letterSpacing="1.4">
          LEVEL
        </text>

        {/* the stars */}
        {points.map((p) => (
          <g
            key={p.stat.def.id}
            onMouseEnter={() => setHover(p.stat)}
            onMouseLeave={() => setHover(null)}
            style={{ cursor: 'pointer' }}
          >
            {p.lit && (
              <circle cx={p.x} cy={p.y} r={p.r + 11} fill={p.stat.def.color} opacity={0.06 + p.intensity * 0.14} />
            )}
            <circle
              cx={p.x}
              cy={p.y}
              r={p.r}
              fill={`color-mix(in oklab, ${p.stat.def.color} ${p.lit ? 30 : 12}%, #0b0f1a)`}
              stroke={p.stat.def.color}
              strokeWidth={focus?.def.id === p.stat.def.id ? 2.4 : 1.2}
              opacity={p.lit ? 1 : 0.5}
            />
            <text x={p.x} y={p.y + 4.5} textAnchor="middle" fontSize={Math.min(15, p.r * 0.95)}>
              {p.stat.def.emoji}
            </text>
            <text
              x={p.x}
              y={p.y + p.r + 14}
              textAnchor="middle"
              fontSize="9.5"
              fill="rgba(255,255,255,0.62)"
              letterSpacing="0.4"
            >
              {p.stat.def.name}
            </text>
            <text x={p.x} y={p.y + p.r + 25} textAnchor="middle" fontSize="9" fill={p.stat.def.color} fontWeight="600">
              {p.stat.level.level}
            </text>
          </g>
        ))}
      </svg>

      <div
        className="card tight"
        style={{ boxShadow: 'none', marginTop: 6, minHeight: 78, borderColor: focus ? `color-mix(in oklab, ${focus.def.color} 35%, transparent)` : undefined }}
      >
        {focus ? (
          <>
            <div className="row" style={{ gap: 8 }}>
              <span style={{ fontSize: 17 }}>{focus.def.emoji}</span>
              <span className="strong">{focus.def.name}</span>
              <span className="chip" style={{ color: focus.def.color }}>
                Level {focus.level.level}
              </span>
              <span className="spacer" />
              <span className="tiny faint num">
                {round(focus.level.into, 0)} / {focus.level.span} XP
              </span>
            </div>
            <div className="hint" style={{ marginTop: 7 }}>
              {focus.def.governs}
            </div>
          </>
        ) : (
          <div className="hint">
            Hover a star. Each one grows with the real hours you put into it — the map is the shape of your
            life, not a decoration.
          </div>
        )}
      </div>
    </div>
  );
}

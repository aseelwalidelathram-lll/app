import type { CSSProperties, ReactNode } from 'react';
import { useEffect } from 'react';

/* ------------------------------------------------------------------ card */

export function Card({
  title,
  aside,
  children,
  className = '',
  style,
}: {
  title?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <section className={`card ${className}`} style={style}>
      {title && (
        <div className="card-title">
          {title}
          {aside && (
            <>
              <span className="spacer" />
              {aside}
            </>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ ring */

export function Ring({
  ratio,
  size = 132,
  stroke = 9,
  color = 'var(--accent)',
  track = 'rgba(255,255,255,0.08)',
  children,
}: {
  ratio: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <div className="ringwrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)', filter: `drop-shadow(0 0 7px ${color})` }}
        />
      </svg>
      <div className="inner">{children}</div>
    </div>
  );
}

/* ----------------------------------------------------------------- meter */

export function Meter({
  ratio,
  color = 'var(--accent)',
  className = '',
  style,
}: {
  ratio: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`meter ${className}`} style={style}>
      <i style={{ width: `${Math.max(0, Math.min(1, ratio)) * 100}%`, background: color }} />
    </div>
  );
}

export function MeterRow({
  label,
  ratio,
  value,
  color,
  icon,
}: {
  label: string;
  ratio: number;
  value: string;
  color?: string;
  icon?: string;
}) {
  return (
    <div className="meter-row">
      <span className="label">
        {icon && <span style={{ marginRight: 5 }}>{icon}</span>}
        {label}
      </span>
      <Meter ratio={ratio} color={color} />
      <span className="val num">{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ misc */

export function Stat({ k, v, s, color }: { k: string; v: ReactNode; s?: ReactNode; color?: string }) {
  return (
    <div className="stat">
      <div className="k">{k}</div>
      <div className="v" style={color ? { color } : undefined}>
        {v}
      </div>
      {s && <div className="s">{s}</div>}
    </div>
  );
}

export function Chip({
  children,
  on,
  gold,
  onClick,
  title,
}: {
  children: ReactNode;
  on?: boolean;
  gold?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  const cls = `chip ${on ? 'on' : ''} ${gold ? 'gold' : ''}`;
  if (onClick) {
    return (
      <button className={cls} onClick={onClick} title={title} type="button">
        {children}
      </button>
    );
  }
  return (
    <span className={cls} title={title}>
      {children}
    </span>
  );
}

export function Empty({ glyph = '🌙', children }: { glyph?: string; children: ReactNode }) {
  return (
    <div className="empty">
      <span className="g">{glyph}</span>
      {children}
    </div>
  );
}

/* ----------------------------------------------------------------- sheet */

export function Sheet({
  title,
  subtitle,
  emoji,
  onClose,
  children,
  footer,
}: {
  title: string;
  subtitle?: ReactNode;
  emoji?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="scrim" onClick={onClose} role="presentation">
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal aria-label={title}>
        <div className="sheet-head">
          {emoji && <div style={{ fontSize: 26, lineHeight: 1.1 }}>{emoji}</div>}
          <div style={{ minWidth: 0 }}>
            <h2>{title}</h2>
            {subtitle && <div className="sub">{subtitle}</div>}
          </div>
          <button className="close-x" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {children}
        {footer && <div style={{ marginTop: 18 }}>{footer}</div>}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- sparkle */

/** Tiny inline bar chart for the last N days. */
export function Sparkbars({ values, color = 'var(--accent)', height = 34 }: { values: number[]; color?: string; height?: number }) {
  const max = Math.max(1, ...values);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height }}>
      {values.map((v, i) => (
        <div
          key={i}
          title={`${Math.round(v)}`}
          style={{
            flex: 1,
            minWidth: 2,
            height: `${Math.max(3, (v / max) * 100)}%`,
            borderRadius: 3,
            background: v > 0 ? color : 'rgba(255,255,255,0.07)',
            opacity: v > 0 ? 0.4 + 0.6 * (v / max) : 1,
            transition: 'height 0.6s cubic-bezier(0.22,1,0.36,1)',
          }}
        />
      ))}
    </div>
  );
}

import { useState } from 'react';
import { ACTION_LIST, ATTRIBUTES, CATEGORIES, DEFAULT_RITUALS } from '../engine';
import { Chip } from '../components/ui';
import { useStore } from '../state/context';

const STEPS = ['welcome', 'name', 'rituals', 'history'] as const;
type Step = (typeof STEPS)[number];

export function Onboarding() {
  const { completeOnboarding } = useStore();
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [rituals, setRituals] = useState<string[]>(DEFAULT_RITUALS);
  const [busy, setBusy] = useState(false);

  const next = () => setStep(STEPS[Math.min(STEPS.length - 1, STEPS.indexOf(step) + 1)]);

  const finish = (demo: boolean) => {
    setBusy(true);
    // Seeding a demo history is a few thousand engine passes; let the button
    // paint its busy state before we block the thread.
    window.setTimeout(() => completeOnboarding({ name: name.trim() || 'Traveller', rituals, demo }), 30);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '32px 20px',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div className="card" style={{ maxWidth: 620, width: '100%', padding: 30 }}>
        {step === 'welcome' && (
          <>
            <div style={{ fontSize: 40, marginBottom: 14 }}>✦</div>
            <h1 style={{ fontSize: 28 }}>Lumen</h1>
            <p className="dim" style={{ marginTop: 10, lineHeight: 1.65 }}>
              This is a life simulation where the simulation is your actual life. You log the real things you
              do — an hour of study, a glass of water, a page of Qur’an, a walk — and they move a character
              that is genuinely you.
            </p>
            <div className="stack" style={{ gap: 10, margin: '20px 0' }}>
              <Point emoji="🔗" title="Nothing sits on its own">
                One logged action moves XP, an attribute, a vital, a streak, several quests, a mastery track and
                sometimes an achievement — all at once, and you can see it happen.
              </Point>
              <Point emoji="🌿" title="Nine attributes, not a to-do list">
                {Object.values(ATTRIBUTES)
                  .map((a) => a.name)
                  .join(' · ')}
              </Point>
              <Point emoji="🕊️" title="It will never make you feel bad">
                No guilt, no red, no punishment for a missed day. Streaks have grace days built in and “Return”
                is one of the achievements.
              </Point>
            </div>
            <button className="btn primary wide" onClick={next}>
              Start
            </button>
          </>
        )}

        {step === 'name' && (
          <>
            <h1 style={{ fontSize: 24 }}>What should I call you?</h1>
            <p className="dim" style={{ marginTop: 8 }}>
              This is only ever shown to you — everything stays in this browser.
            </p>
            <input
              className="search"
              style={{ marginTop: 18, fontSize: 17, padding: '13px 15px' }}
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && next()}
              maxLength={24}
              autoFocus
            />
            <button className="btn primary wide" style={{ marginTop: 18 }} onClick={next}>
              Continue
            </button>
          </>
        )}

        {step === 'rituals' && (
          <>
            <h1 style={{ fontSize: 24 }}>What does a complete day look like?</h1>
            <p className="dim" style={{ marginTop: 8 }}>
              Pick the few things that, if you did them, would make you feel the day went well. These become
              your rituals — they drive day completion, streaks and part of your quests. You can change them
              whenever you like.
            </p>
            <div className="stack" style={{ gap: 14, margin: '18px 0', maxHeight: '42vh', overflow: 'auto' }}>
              {Object.values(CATEGORIES).map((cat) => (
                <div key={cat.id}>
                  <div className="card-title" style={{ marginBottom: 7, color: cat.color }}>
                    {cat.emoji} {cat.name}
                  </div>
                  <div className="row-wrap">
                    {ACTION_LIST.filter((a) => a.category === cat.id).map((a) => (
                      <Chip
                        key={a.id}
                        on={rituals.includes(a.id)}
                        onClick={() =>
                          setRituals((p) =>
                            p.includes(a.id) ? p.filter((x) => x !== a.id) : p.length >= 8 ? p : [...p, a.id],
                          )
                        }
                      >
                        {a.emoji} {a.name}
                      </Chip>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button className="btn primary wide" onClick={next} disabled={rituals.length < 2}>
              {rituals.length} chosen · Continue
            </button>
          </>
        )}

        {step === 'history' && (
          <>
            <h1 style={{ fontSize: 24 }}>One last choice</h1>
            <p className="dim" style={{ marginTop: 8, lineHeight: 1.6 }}>
              A brand new world is empty — level 1, no map, no history. That is the honest way to start, and
              everything you earn from here will be real.
            </p>
            <p className="dim" style={{ marginTop: 10, lineHeight: 1.6 }}>
              Or I can fill in ten weeks of invented history first, so you can see what the app looks like once
              it has been lived in. It is clearly fake data and you can wipe it from the Workshop at any time.
            </p>
            <div className="stack" style={{ gap: 10, marginTop: 22 }}>
              <button className="btn primary wide" onClick={() => finish(false)} disabled={busy}>
                {busy ? 'Building your world…' : 'Start empty — this is my real life'}
              </button>
              <button className="btn wide" onClick={() => finish(true)} disabled={busy}>
                {busy ? 'Building…' : 'Fill it with example history so I can look around'}
              </button>
            </div>
          </>
        )}

        <div className="row" style={{ gap: 6, marginTop: 22, justifyContent: 'center' }}>
          {STEPS.map((s) => (
            <span
              key={s}
              style={{
                width: s === step ? 18 : 6,
                height: 6,
                borderRadius: 99,
                background: s === step ? 'var(--accent)' : 'rgba(255,255,255,0.16)',
                transition: 'width 0.3s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Point({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div className="row" style={{ alignItems: 'flex-start', gap: 12 }}>
      <span style={{ fontSize: 19, lineHeight: 1.35 }}>{emoji}</span>
      <div>
        <div className="small strong">{title}</div>
        <div className="hint" style={{ marginTop: 2 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { SHIELD_COST, SIGILS, THEMES, downloadSave, importSave } from '../engine';
import { Card, Chip } from '../components/ui';
import { useStore } from '../state/context';
import { isInstalled, onInstallability, promptInstall } from '../pwa';

/* --------------------------------------------------------------- install */

function InstallCard() {
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(isInstalled);

  useEffect(() => onInstallability(setCanInstall), []);

  if (installed) return null;

  return (
    <Card title="Put Lumen on your home screen">
      <div className="hint" style={{ marginBottom: 13 }}>
        Installed, it opens like any other app — its own icon, full screen, no browser bar — and it still works
        with no signal. Your save stays on this device either way.
      </div>
      {canInstall ? (
        <button
          className="btn primary"
          onClick={async () => {
            if (await promptInstall()) setInstalled(true);
          }}
        >
          ✦ Install Lumen
        </button>
      ) : (
        <div className="tiny faint">
          Your browser handles this from its own menu: on Android Chrome, tap ⋮ → <em>Add to Home screen</em>. On
          iPhone, tap Share → <em>Add to Home Screen</em>.
        </div>
      )}
    </Card>
  );
}

export function Workshop() {
  const { world, save, buy, buyGrace, wear, settings, resetEverything, loadFrom } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const owns = (id: string) => save.unlocked.cosmetics.includes(id);

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="page-head">
        <h1>Workshop</h1>
        <p className="sub">
          Sparks are earned from quests, achievements and missions. They buy nothing that makes you stronger —
          only ways to make this place feel more like yours, plus grace days for the streak.
        </p>
      </div>

      <InstallCard />

      <Card>
        <div className="row" style={{ gap: 14, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 30 }}>✦</div>
          <div>
            <div className="hero-name" style={{ fontSize: 26 }}>
              {world.sparks}
            </div>
            <div className="tiny faint">sparks available · {save.sparksSpent} spent so far</div>
          </div>
          <span className="spacer" />
          <div style={{ textAlign: 'right' }}>
            <div className="small">🛡️ {save.purchasedShields + Math.min(3, Math.floor(world.activeDays / 10))} grace days</div>
            <div className="tiny faint">{world.streak.graceUsed} currently holding your streak together</div>
          </div>
        </div>
      </Card>

      <Card title="Grace">
        <div className="hint" style={{ marginBottom: 13 }}>
          A grace day lets a missed day pass without breaking your streak. You earn one free for every ten
          active days — this is simply a way to hold a few more. Streaks are meant to encourage you, not to
          become something you are afraid of losing.
        </div>
        <button className="btn" onClick={buyGrace} disabled={world.sparks < SHIELD_COST}>
          🛡️ Hold another grace day · {SHIELD_COST} ✦
        </button>
      </Card>

      <Card title="Themes">
        <div className="grid g3" style={{ gap: 10 }}>
          {THEMES.map((t) => {
            const owned = owns(t.id);
            const active = save.profile.theme === t.id;
            return (
              <div key={t.id} className="tile" style={{ borderColor: active ? t.accent : undefined }}>
                <div
                  style={{
                    height: 42,
                    borderRadius: 11,
                    background: `linear-gradient(135deg, ${t.accent}, ${t.accentSoft})`,
                    marginBottom: 10,
                    opacity: owned ? 1 : 0.45,
                  }}
                />
                <div className="n">{t.name}</div>
                <div className="b">{t.blurb}</div>
                <div style={{ marginTop: 10 }}>
                  {owned ? (
                    <button
                      className={`btn sm ${active ? 'primary' : ''}`}
                      onClick={() => wear('theme', t.id)}
                      disabled={active}
                    >
                      {active ? 'Wearing' : 'Wear'}
                    </button>
                  ) : (
                    <button className="btn sm" onClick={() => buy(t.id)} disabled={world.sparks < t.cost}>
                      {t.cost} ✦
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Sigils">
        <div className="row-wrap">
          {SIGILS.map((s) => {
            const owned = owns(s.id);
            const active = save.profile.sigil === s.glyph;
            return (
              <button
                key={s.id}
                className="tile"
                style={{ width: 96, borderColor: active ? 'var(--accent)' : undefined, opacity: owned ? 1 : 0.55 }}
                onClick={() => (owned ? wear('sigil', s.id) : buy(s.id))}
                disabled={!owned && world.sparks < s.cost}
              >
                <div className="g">{s.glyph}</div>
                <div className="n" style={{ fontSize: 12 }}>
                  {s.name}
                </div>
                <div className="b">{owned ? (active ? 'worn' : 'owned') : `${s.cost} ✦`}</div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card title="Settings">
        <div className="stack" style={{ gap: 14 }}>
          <div className="row">
            <div>
              <div className="small strong">Reduced motion</div>
              <div className="tiny faint">Turn off animations and transitions.</div>
            </div>
            <span className="spacer" />
            <Chip on={save.settings.reducedMotion} onClick={() => settings({ reducedMotion: !save.settings.reducedMotion })}>
              {save.settings.reducedMotion ? 'On' : 'Off'}
            </Chip>
          </div>

          <div className="row">
            <div>
              <div className="small strong">Day starts at</div>
              <div className="tiny faint">
                Anything logged before this hour counts toward the previous day. Useful if you are often up late.
              </div>
            </div>
            <span className="spacer" />
            <div className="row-wrap">
              {[0, 3, 4, 5, 6].map((h) => (
                <Chip key={h} on={save.settings.dayStartHour === h} onClick={() => settings({ dayStartHour: h })}>
                  {String(h).padStart(2, '0')}:00
                </Chip>
              ))}
            </div>
          </div>

          <div className="row">
            <div>
              <div className="small strong">Evening review from</div>
              <div className="tiny faint">When the app offers to close out the day with you.</div>
            </div>
            <span className="spacer" />
            <div className="row-wrap">
              {[18, 20, 21, 22].map((h) => (
                <Chip key={h} on={save.settings.eveningHour === h} onClick={() => settings({ eveningHour: h })}>
                  {h}:00
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card title="Your save file">
        <div className="hint" style={{ marginBottom: 13 }}>
          Everything lives in this browser and nowhere else — there is no account and no server. Export a copy
          if you want it somewhere safer.
        </div>
        <div className="row-wrap">
          <button className="btn" onClick={() => downloadSave(save)}>
            ⬇ Export
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            ⬆ Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                loadFrom(importSave(await file.text()));
                setImportError(null);
              } catch (err) {
                setImportError(err instanceof Error ? err.message : 'Could not read that file.');
              }
              e.target.value = '';
            }}
          />
          <span className="spacer" />
          {confirmReset ? (
            <>
              <span className="tiny faint">This erases everything. Sure?</span>
              <button className="btn sm danger" onClick={resetEverything}>
                Erase it all
              </button>
              <button className="btn sm ghost" onClick={() => setConfirmReset(false)}>
                Keep it
              </button>
            </>
          ) : (
            <button className="btn danger" onClick={() => setConfirmReset(true)}>
              Start over
            </button>
          )}
        </div>
        {importError && (
          <div className="tiny" style={{ color: '#ff9b9b', marginTop: 10 }}>
            {importError}
          </div>
        )}
        <div className="tiny faint" style={{ marginTop: 12 }}>
          {save.log.length} actions logged · {save.ledger.length} rewards recorded · save format v{save.version}
        </div>
      </Card>
    </div>
  );
}

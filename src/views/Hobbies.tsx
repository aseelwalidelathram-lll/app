import { useMemo, useState } from 'react';
import {
  ACTIONS,
  ACTION_LIST,
  HOBBY_BLUEPRINTS,
  HOBBY_EMOJI,
  HOBBY_PALETTE,
  PICK_REWARD,
  createHobby,
  fmtDuration,
  prettyDate,
  plural,
} from '../engine';
import type { Hobby, ShelfItem } from '../engine';
import type { HobbyState } from '../engine/derive';
import { Picture, PictureInput } from '../components/Picture';
import { Card, Chip, Meter, Sheet } from '../components/ui';
import { useStore } from '../state/context';

export function Hobbies({ onLog }: { onLog: (actionId?: string) => void }) {
  const { world } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);

  const open = openId ? world.hobbyById[openId] : null;
  if (open) return <HobbySpace hobby={open} onBack={() => setOpenId(null)} onLog={onLog} />;

  return <HobbyList onOpen={setOpenId} />;
}

/* ------------------------------------------------------------- the list */

function HobbyList({ onOpen }: { onOpen: (id: string) => void }) {
  const { world } = useStore();
  const [making, setMaking] = useState(false);

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="page-head">
        <h1>Hobbies</h1>
        <p className="sub">
          The parts of your life that are yours rather than required. Each one keeps its own shelf, its own
          journal and its own hours.
        </p>
      </div>

      {world.hobbies.length === 0 ? (
        <StarterPalette />
      ) : (
        <>
          <div className="grid hobby-grid">
            {world.hobbies.map((h) => (
              <HobbyCard key={h.def.id} hobby={h} onOpen={() => onOpen(h.def.id)} />
            ))}
          </div>
          <div className="row-wrap">
            <button className="btn" onClick={() => setMaking(true)}>
              ＋ Another hobby
            </button>
          </div>
        </>
      )}

      {making && <HobbyEditor onClose={() => setMaking(false)} />}
    </div>
  );
}

function HobbyCard({ hobby, onOpen }: { hobby: HobbyState; onOpen: () => void }) {
  const { def, pick, minutes, streak, active, finished } = hobby;

  return (
    <button className="hobby-card" onClick={onOpen} style={{ borderColor: `color-mix(in oklab, ${def.color} 34%, transparent)` }}>
      <div className="hobby-cover" style={{ background: `linear-gradient(150deg, ${def.color}22, transparent)` }}>
        {def.imageId ? (
          <Picture imageId={def.imageId} className="pic-fill" />
        ) : (
          <span style={{ fontSize: 40 }}>{def.emoji}</span>
        )}
      </div>

      <div className="hobby-body">
        <div className="row" style={{ gap: 8 }}>
          <span style={{ fontSize: 17 }}>{def.emoji}</span>
          <span className="strong" style={{ fontSize: 15.5 }}>{def.name}</span>
          <span className="spacer" />
          {streak > 0 && <span className="tiny" style={{ color: 'var(--warm)' }}>🔥{streak}</span>}
        </div>

        {pick ? (
          <div className="hobby-pick-mini">
            <div className="tiny faint">This week</div>
            <div className="small strong ellipsis">{pick.item.title}</div>
            {pick.target > 0 && <Meter ratio={pick.ratio} color={def.color} className="thin" />}
          </div>
        ) : (
          <div className="tiny faint" style={{ marginTop: 8 }}>
            {def.shelf.length ? 'Shelf all finished — add something new.' : `No ${def.shelfNoun} yet.`}
          </div>
        )}

        <div className="row tiny faint" style={{ marginTop: 10 }}>
          <span>{minutes > 0 ? fmtDuration(minutes) : 'not started'}</span>
          <span className="spacer" />
          <span>
            {active.length} on the shelf{finished.length > 0 && ` · ${finished.length} done`}
          </span>
        </div>
      </div>
    </button>
  );
}

/** Shown once, when there are no hobbies yet. */
function StarterPalette() {
  const { addHobby } = useStore();
  const [custom, setCustom] = useState(false);

  return (
    <>
      <Card title="Start with the ones you already have">
        <div className="hint" style={{ marginBottom: 14 }}>
          Tap any of these and it becomes yours — name, colour, shelf and all of it editable afterwards. None of
          this is fixed, and nothing is lost by adding one and changing your mind.
        </div>
        <div className="grid g3" style={{ gap: 10 }}>
          {HOBBY_BLUEPRINTS.map((b) => (
            <button
              key={b.name}
              className="tile"
              style={{ textAlign: 'left', borderColor: `color-mix(in oklab, ${b.color} 30%, transparent)` }}
              onClick={() => addHobby(createHobby({ ...b }))}
            >
              <div className="row" style={{ gap: 8 }}>
                <span className="g" style={{ fontSize: 22 }}>{b.emoji}</span>
                <span className="n" style={{ marginTop: 0, color: b.color }}>{b.name}</span>
              </div>
              <div className="b" style={{ marginTop: 6 }}>{b.blurb}</div>
            </button>
          ))}
        </div>
        <div className="row-wrap" style={{ marginTop: 16 }}>
          <button
            className="btn primary"
            onClick={() => HOBBY_BLUEPRINTS.forEach((b) => addHobby(createHobby({ ...b })))}
          >
            Add all seven
          </button>
          <button className="btn" onClick={() => setCustom(true)}>
            Make my own
          </button>
        </div>
      </Card>

      {custom && <HobbyEditor onClose={() => setCustom(false)} />}
    </>
  );
}

/* ------------------------------------------------------ one hobby's space */

function HobbySpace({
  hobby,
  onBack,
  onLog,
}: {
  hobby: HobbyState;
  onBack: () => void;
  onLog: (actionId?: string) => void;
}) {
  const { def, pick, minutes, days, streak, weekMinutes, active, finished, journal, progress } = hobby;
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [choosing, setChoosing] = useState(false);

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="row" style={{ gap: 10 }}>
        <button className="btn sm ghost" onClick={onBack}>
          ← Hobbies
        </button>
        <span className="spacer" />
        <button className="btn sm ghost" onClick={() => setEditing(true)}>
          Edit
        </button>
      </div>

      {/* --------------------------------------------------------- header */}
      <Card style={{ overflow: 'hidden' }}>
        {def.imageId && (
          <div className="hobby-banner">
            <Picture imageId={def.imageId} className="pic-fill" />
          </div>
        )}
        <div className="row" style={{ gap: 14, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 18,
              display: 'grid',
              placeItems: 'center',
              fontSize: 27,
              background: `color-mix(in oklab, ${def.color} 18%, transparent)`,
              border: `1px solid color-mix(in oklab, ${def.color} 38%, transparent)`,
            }}
          >
            {def.emoji}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="hero-name" style={{ fontSize: 24 }}>{def.name}</div>
            {def.blurb && <div className="tiny faint" style={{ marginTop: 3 }}>{def.blurb}</div>}
            <div className="row-wrap" style={{ marginTop: 9 }}>
              <Chip>{minutes > 0 ? fmtDuration(minutes) : 'no hours yet'}</Chip>
              <Chip>{days} {plural(days, 'day')}</Chip>
              {streak > 0 && <Chip gold>🔥 {streak}-day run</Chip>}
              {weekMinutes > 0 && <Chip>{fmtDuration(weekMinutes)} this week</Chip>}
            </div>
          </div>
        </div>

        {def.actionIds.length > 0 && (
          <div className="row-wrap" style={{ marginTop: 15 }}>
            {def.actionIds
              .filter((id) => ACTIONS[id])
              .map((id) => (
                <button key={id} className="btn sm" onClick={() => onLog(id)}>
                  {ACTIONS[id].emoji} {ACTIONS[id].name}
                </button>
              ))}
          </div>
        )}
      </Card>

      {/* ----------------------------------------------------- this week */}
      <Card
        title="This week"
        aside={
          active.length > 1 && (
            <button className="btn sm ghost" onClick={() => setChoosing(true)}>
              Choose another
            </button>
          )
        }
      >
        {pick ? <PickPanel hobby={hobby} /> : (
          <div className="hint">
            {def.shelf.length
              ? `Everything on this shelf is finished. Add another ${def.shelfNounSingular} whenever you find one.`
              : `Add a few ${def.shelfNoun} and one of them will be waiting here each week.`}
          </div>
        )}
      </Card>

      {/* --------------------------------------------------------- shelf */}
      <Card
        title={`The shelf`}
        aside={
          <button className="btn sm" onClick={() => setAdding(true)}>
            ＋ Add
          </button>
        }
      >
        {active.length === 0 && finished.length === 0 ? (
          <div className="hint">Nothing here yet. What is on your list?</div>
        ) : (
          <div className="stack" style={{ gap: 9 }}>
            {active.map((item) => (
              <ShelfRow key={item.id} hobby={hobby} item={item} progress={progress[item.id] ?? 0} />
            ))}
            {finished.length > 0 && (
              <>
                <div className="divider" style={{ margin: '8px 0' }} />
                <div className="tiny faint">
                  Finished · {finished.length} {plural(finished.length, def.shelfNounSingular, def.shelfNoun)}
                </div>
                {finished.map((item) => (
                  <ShelfRow key={item.id} hobby={hobby} item={item} progress={progress[item.id] ?? 0} done />
                ))}
              </>
            )}
          </div>
        )}
      </Card>

      {/* ------------------------------------------------------- journal */}
      <JournalPanel hobby={hobby} />

      {editing && <HobbyEditor hobby={def} onClose={() => setEditing(false)} onDeleted={onBack} />}
      {adding && <ShelfEditor hobby={def} onClose={() => setAdding(false)} />}
      {choosing && (
        <PickChooser hobby={hobby} onClose={() => setChoosing(false)} />
      )}
      {journal.length === 0 && null}
    </div>
  );
}

function PickPanel({ hobby }: { hobby: HobbyState }) {
  const { finishItem } = useStore();
  const { def, pick } = hobby;
  if (!pick) return null;
  const { item, progress, target, ratio, carried, chosen } = pick;

  return (
    <div className="pick">
      {item.imageId && (
        <div className="pick-cover">
          <Picture imageId={item.imageId} className="pic-fill" />
        </div>
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="row" style={{ gap: 8 }}>
          <span className="strong" style={{ fontSize: 17 }}>{item.title}</span>
        </div>
        {item.by && <div className="tiny faint">{item.by}</div>}

        {target > 0 && (
          <div style={{ marginTop: 11 }}>
            <Meter ratio={ratio} color={def.color} />
            <div className="row tiny faint" style={{ marginTop: 5 }}>
              <span className="num">
                {Math.round(progress)} / {target} {item.totalUnit ?? ''}
              </span>
              <span className="spacer" />
              <span>{Math.round(ratio * 100)}%</span>
            </div>
          </div>
        )}

        <div className="row-wrap" style={{ marginTop: 12 }}>
          <Chip gold>+{PICK_REWARD.xp} XP · {PICK_REWARD.sparks} ✦ when it is done</Chip>
          {carried && <Chip>carried over</Chip>}
          {chosen && <Chip>your choice</Chip>}
        </div>

        <div className="hint" style={{ marginTop: 11 }}>
          No rush — it waits for you. Nothing expires and nothing is lost if this week goes elsewhere.
        </div>

        <div className="row-wrap" style={{ marginTop: 12 }}>
          <button className="btn sm primary" onClick={() => finishItem(def.id, item.id)}>
            ✓ Finished it
          </button>
        </div>
      </div>
    </div>
  );
}

function PickChooser({ hobby, onClose }: { hobby: HobbyState; onClose: () => void }) {
  const { choosePick } = useStore();
  const { def, active, progress, pick } = hobby;

  return (
    <Sheet
      title="Choose this week's pick"
      subtitle="Whatever you would actually rather be doing. This only changes what is offered — nothing on the shelf moves."
      emoji={def.emoji}
      onClose={onClose}
    >
      <div className="stack" style={{ gap: 8 }}>
        {active.map((item) => (
          <button
            key={item.id}
            className="tile"
            style={{
              textAlign: 'left',
              borderColor: pick?.item.id === item.id ? def.color : undefined,
            }}
            onClick={() => {
              choosePick(def.id, item.id);
              onClose();
            }}
          >
            <div className="row" style={{ gap: 8 }}>
              <span className="n" style={{ marginTop: 0 }}>{item.title}</span>
              <span className="spacer" />
              {pick?.item.id === item.id && <span className="tiny faint">current</span>}
            </div>
            {item.by && <div className="b">{item.by}</div>}
            {item.total ? (
              <div className="b">
                {Math.round(progress[item.id] ?? 0)} / {item.total} {item.totalUnit ?? ''}
              </div>
            ) : null}
          </button>
        ))}
      </div>
    </Sheet>
  );
}

function ShelfRow({
  hobby,
  item,
  progress,
  done,
}: {
  hobby: HobbyState;
  item: ShelfItem;
  progress: number;
  done?: boolean;
}) {
  const { finishItem, reopenItem, dropShelfItem } = useStore();
  const [open, setOpen] = useState(false);
  const { def } = hobby;

  return (
    <>
      <div className="shelf-row" style={{ opacity: done ? 0.62 : 1 }}>
        {item.imageId ? (
          <Picture imageId={item.imageId} className="shelf-thumb" />
        ) : (
          <div className="shelf-thumb placeholder" style={{ background: `color-mix(in oklab, ${def.color} 14%, transparent)` }}>
            {def.emoji}
          </div>
        )}

        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="small strong ellipsis">{item.title}</div>
          {item.by && <div className="tiny faint ellipsis">{item.by}</div>}
          {item.total && !done ? (
            <div style={{ marginTop: 6 }}>
              <Meter ratio={Math.min(1, progress / item.total)} color={def.color} className="thin" />
              <div className="tiny faint num" style={{ marginTop: 4 }}>
                {Math.round(progress)} / {item.total} {item.totalUnit ?? ''}
              </div>
            </div>
          ) : null}
          {done && item.finishedOn && (
            <div className="tiny faint" style={{ marginTop: 4 }}>Finished {prettyDate(item.finishedOn)}</div>
          )}
        </div>

        <div className="row" style={{ gap: 6 }}>
          {done ? (
            <button className="btn sm ghost" onClick={() => reopenItem(def.id, item.id)} title="Put it back">
              ↩
            </button>
          ) : (
            <button className="btn sm ghost" onClick={() => finishItem(def.id, item.id)} title="Mark finished">
              ✓
            </button>
          )}
          <button className="btn sm ghost" onClick={() => setOpen(true)} title="Edit">
            ⋯
          </button>
        </div>
      </div>

      {open && (
        <ShelfEditor
          hobby={def}
          item={item}
          onClose={() => setOpen(false)}
          onDeleted={() => dropShelfItem(def.id, item.id)}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------- journal */

function JournalPanel({ hobby }: { hobby: HobbyState }) {
  const { journal: write, dropJournal } = useStore();
  const [text, setText] = useState('');
  const [about, setAbout] = useState<string>('');
  const { def, journal, active } = hobby;

  const submit = () => {
    if (!text.trim()) return;
    write(def.id, text.trim(), about || undefined);
    setText('');
    setAbout('');
  };

  return (
    <Card title="Journal">
      <div className="hint" style={{ marginBottom: 11 }}>
        Whatever you want to remember about this. Nothing here is scored, counted against you, or shown anywhere
        else in the app.
      </div>

      <textarea
        className="journal-input"
        rows={3}
        value={text}
        placeholder={`Something about ${def.name.toLowerCase()}…`}
        onChange={(e) => setText(e.target.value)}
      />

      {active.length > 0 && (
        <div className="row-wrap" style={{ marginTop: 9 }}>
          <Chip on={about === ''} onClick={() => setAbout('')}>
            just {def.name.toLowerCase()}
          </Chip>
          {active.slice(0, 5).map((i) => (
            <Chip key={i.id} on={about === i.id} onClick={() => setAbout(i.id)}>
              {i.title}
            </Chip>
          ))}
        </div>
      )}

      <div className="row-wrap" style={{ marginTop: 11 }}>
        <button className="btn primary sm" onClick={submit} disabled={!text.trim()}>
          Save entry
        </button>
      </div>

      {journal.length > 0 && (
        <div className="stack" style={{ gap: 11, marginTop: 18 }}>
          {journal.map((entry) => {
            const item = def.shelf.find((i) => i.id === entry.itemId);
            return (
              <div key={entry.id} className="journal-entry">
                <div className="row tiny faint" style={{ marginBottom: 5 }}>
                  <span>{prettyDate(entry.date)}</span>
                  {item && <span style={{ color: def.color }}>· {item.title}</span>}
                  <span className="spacer" />
                  <button className="btn sm ghost" onClick={() => dropJournal(entry.id)} title="Delete">
                    ×
                  </button>
                </div>
                <div className="small" style={{ whiteSpace: 'pre-wrap' }}>{entry.text}</div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* -------------------------------------------------------------- editors */

function HobbyEditor({
  hobby,
  onClose,
  onDeleted,
}: {
  hobby?: Hobby;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const { addHobby, editHobby, dropHobby } = useStore();
  const [draft, setDraft] = useState<Partial<Hobby>>(
    hobby ?? { name: '', emoji: '✦', color: HOBBY_PALETTE[0], shelfNoun: 'things', shelfNounSingular: 'thing', actionIds: [] },
  );
  const [confirmDrop, setConfirmDrop] = useState(false);

  const set = (patch: Partial<Hobby>) => setDraft((d) => ({ ...d, ...patch }));
  const valid = (draft.name ?? '').trim().length > 0;

  const craftish = useMemo(
    () => ACTION_LIST.filter((a) => ['craft', 'mind', 'body'].includes(a.category)),
    [],
  );

  return (
    <Sheet
      title={hobby ? 'Edit hobby' : 'A new hobby'}
      subtitle="All of this is yours to change later."
      emoji={draft.emoji ?? '✦'}
      onClose={onClose}
      footer={
        <button
          className="btn primary wide"
          disabled={!valid}
          onClick={() => {
            if (hobby) editHobby(hobby.id, draft);
            else addHobby(createHobby({ ...draft, name: draft.name!.trim() } as Partial<Hobby> & { name: string }));
            onClose();
          }}
        >
          {hobby ? 'Save' : 'Add it'}
        </button>
      }
    >
      <div className="stack" style={{ gap: 17 }}>
        <div>
          <div className="card-title" style={{ marginBottom: 7 }}>Name</div>
          <input
            className="search"
            value={draft.name ?? ''}
            maxLength={28}
            placeholder="Reading, baking, crochet…"
            onChange={(e) => set({ name: e.target.value })}
          />
        </div>

        <div>
          <div className="card-title" style={{ marginBottom: 7 }}>A line about it</div>
          <input
            className="search"
            value={draft.blurb ?? ''}
            maxLength={90}
            placeholder="Optional."
            onChange={(e) => set({ blurb: e.target.value })}
          />
        </div>

        <div>
          <div className="card-title" style={{ marginBottom: 7 }}>Symbol</div>
          <div className="row-wrap">
            {HOBBY_EMOJI.map((e) => (
              <Chip key={e} on={draft.emoji === e} onClick={() => set({ emoji: e })}>
                {e}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <div className="card-title" style={{ marginBottom: 7 }}>Colour</div>
          <div className="row-wrap">
            {HOBBY_PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => set({ color: c })}
                className="swatch"
                style={{ background: c, outline: draft.color === c ? '2px solid var(--text)' : 'none' }}
                title={c}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="card-title" style={{ marginBottom: 7 }}>Its shelf holds…</div>
          <div className="row" style={{ gap: 8 }}>
            <input
              className="search"
              value={draft.shelfNoun ?? ''}
              maxLength={18}
              placeholder="books"
              onChange={(e) => set({ shelfNoun: e.target.value })}
            />
            <input
              className="search"
              value={draft.shelfNounSingular ?? ''}
              maxLength={18}
              placeholder="book"
              onChange={(e) => set({ shelfNounSingular: e.target.value })}
            />
          </div>
          <div className="tiny faint" style={{ marginTop: 6 }}>
            Plural, then singular. The app uses your words rather than calling everything an “item”.
          </div>
        </div>

        <div>
          <div className="card-title" style={{ marginBottom: 7 }}>Counted in</div>
          <input
            className="search"
            value={draft.defaultItemUnit ?? ''}
            maxLength={18}
            placeholder="pages, rows, hours…"
            onChange={(e) => set({ defaultItemUnit: e.target.value })}
          />
        </div>

        <div>
          <div className="card-title" style={{ marginBottom: 7 }}>Hours here count as</div>
          <div className="row-wrap">
            {craftish.map((a) => {
              const on = (draft.actionIds ?? []).includes(a.id);
              return (
                <Chip
                  key={a.id}
                  on={on}
                  onClick={() =>
                    set({
                      actionIds: on
                        ? (draft.actionIds ?? []).filter((x) => x !== a.id)
                        : [...(draft.actionIds ?? []), a.id],
                    })
                  }
                >
                  {a.emoji} {a.name}
                </Chip>
              );
            })}
          </div>
          <div className="tiny faint" style={{ marginTop: 6 }}>
            Logging any of these anywhere in the app counts toward this hobby — you never have to log it twice.
          </div>
        </div>

        <div>
          <div className="card-title" style={{ marginBottom: 7 }}>Picture</div>
          <PictureInput imageId={draft.imageId} onChange={(id) => set({ imageId: id })} />
        </div>

        {hobby && (
          <div className="row-wrap">
            {confirmDrop ? (
              <>
                <span className="tiny faint">
                  Removes the hobby and its journal. Your logged hours stay — they were still lived.
                </span>
                <button
                  className="btn sm danger"
                  onClick={() => {
                    dropHobby(hobby.id);
                    onClose();
                    onDeleted?.();
                  }}
                >
                  Remove it
                </button>
                <button className="btn sm ghost" onClick={() => setConfirmDrop(false)}>
                  Keep it
                </button>
              </>
            ) : (
              <button className="btn sm danger" onClick={() => setConfirmDrop(true)}>
                Remove this hobby
              </button>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
}

function ShelfEditor({
  hobby,
  item,
  onClose,
  onDeleted,
}: {
  hobby: Hobby;
  item?: ShelfItem;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const { addToShelf, editShelfItem } = useStore();
  const [draft, setDraft] = useState<Partial<ShelfItem>>(
    item ?? { title: '', totalUnit: hobby.defaultItemUnit },
  );
  const set = (patch: Partial<ShelfItem>) => setDraft((d) => ({ ...d, ...patch }));
  const valid = (draft.title ?? '').trim().length > 0;

  return (
    <Sheet
      title={item ? `Edit ${hobby.shelfNounSingular}` : `Add a ${hobby.shelfNounSingular}`}
      subtitle={`Onto your ${hobby.name.toLowerCase()} shelf.`}
      emoji={hobby.emoji}
      onClose={onClose}
      footer={
        <button
          className="btn primary wide"
          disabled={!valid}
          onClick={() => {
            const clean = { ...draft, title: draft.title!.trim() };
            if (item) editShelfItem(hobby.id, item.id, clean);
            else addToShelf(hobby.id, clean as Partial<ShelfItem> & { title: string });
            onClose();
          }}
        >
          {item ? 'Save' : 'Add to shelf'}
        </button>
      }
    >
      <div className="stack" style={{ gap: 17 }}>
        <div>
          <div className="card-title" style={{ marginBottom: 7 }}>Title</div>
          <input
            className="search"
            value={draft.title ?? ''}
            maxLength={80}
            autoFocus
            onChange={(e) => set({ title: e.target.value })}
          />
        </div>

        <div>
          <div className="card-title" style={{ marginBottom: 7 }}>By</div>
          <input
            className="search"
            value={draft.by ?? ''}
            maxLength={60}
            placeholder="Author, studio, whoever made it. Optional."
            onChange={(e) => set({ by: e.target.value })}
          />
        </div>

        <div>
          <div className="card-title" style={{ marginBottom: 7 }}>How big is it?</div>
          <div className="row" style={{ gap: 8 }}>
            <input
              className="search"
              type="number"
              min={0}
              value={draft.total ?? ''}
              placeholder="244"
              onChange={(e) => set({ total: e.target.value ? Number(e.target.value) : undefined })}
            />
            <input
              className="search"
              value={draft.totalUnit ?? ''}
              maxLength={18}
              placeholder={hobby.defaultItemUnit ?? 'pages'}
              onChange={(e) => set({ totalUnit: e.target.value })}
            />
          </div>
          <div className="tiny faint" style={{ marginTop: 6 }}>
            Optional. Leave it blank for things that do not have a size — you can still mark them finished.
          </div>
        </div>

        <div>
          <div className="card-title" style={{ marginBottom: 7 }}>Note</div>
          <input
            className="search"
            value={draft.note ?? ''}
            maxLength={140}
            placeholder="Why this one. Optional."
            onChange={(e) => set({ note: e.target.value })}
          />
        </div>

        <div>
          <div className="card-title" style={{ marginBottom: 7 }}>Cover</div>
          <PictureInput imageId={draft.imageId} onChange={(id) => set({ imageId: id })} shape="square" />
        </div>

        {item && onDeleted && (
          <button
            className="btn sm danger"
            onClick={() => {
              onDeleted();
              onClose();
            }}
          >
            Take it off the shelf
          </button>
        )}
      </div>
    </Sheet>
  );
}

import { addDays, clamp, daysBetween, heatLevel, prettyDate, weekStart } from '../engine';
import type { World } from '../engine/derive';

/** A year of days, seven to a column. Gaps are shown without comment. */
export function Heatmap({ world, weeks }: { world: World; weeks?: number }) {
  const end = world.today;
  // Show the history that exists plus a little room, rather than a wall of
  // empty squares from before the player arrived.
  const span = weeks ?? clamp(Math.ceil((daysBetween(world.firstDay, end) + 1) / 7) + 2, 8, 53);
  // Start on the Monday `weeks` back so the grid lines up by weekday.
  const start = addDays(weekStart(end), -(span - 1) * 7);

  const columns: string[][] = [];
  for (let w = 0; w < span; w++) {
    const col: string[] = [];
    for (let d = 0; d < 7; d++) col.push(addDays(start, w * 7 + d));
    columns.push(col);
  }

  return (
    <div className="heat">
      {columns.map((col, i) =>
        col.map((day) => {
          const summary = world.daysByKey[day];
          const future = day > end;
          return (
            <i
              key={`${i}-${day}`}
              data-l={future ? 0 : heatLevel(summary?.xp ?? 0)}
              data-today={day === end ? 1 : 0}
              style={future ? { opacity: 0.25 } : undefined}
              title={
                future
                  ? ''
                  : `${prettyDate(day)} — ${Math.round(summary?.xp ?? 0)} XP${
                      summary?.complete ? ' · every ritual done' : ''
                    }`
              }
            />
          );
        }),
      )}
    </div>
  );
}

import { HeatMapSkeleton } from './HeatMapSkeleton';

const WEEKS = 12;
const DAYS = 7;
const TOTAL_DAYS = WEEKS * DAYS;

type Props = {
  days: Record<string, number>;
  loading?: boolean;
};

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildGrid(days: Record<string, number>): Array<{ key: string; count: number; isToday: boolean }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = toDateKey(today);

  const start = new Date(today);
  start.setDate(start.getDate() - (TOTAL_DAYS - 1));
  // Align to Sunday (GitHub-style columns = weeks)
  start.setDate(start.getDate() - start.getDay());

  const cells: Array<{ key: string; count: number; isToday: boolean }> = [];
  const cursor = new Date(start);

  while (cells.length < TOTAL_DAYS) {
    const key = toDateKey(cursor);
    cells.push({
      key,
      count: days[key] ?? 0,
      isToday: key === todayKey,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return cells.slice(-TOTAL_DAYS);
}

function levelClass(count: number): string {
  if (count >= 3) return 'heat-map-cell-l3';
  if (count >= 2) return 'heat-map-cell-l2';
  if (count >= 1) return 'heat-map-cell-l1';
  return '';
}

export function ActivityHeatMap({ days, loading = false }: Props) {
  if (loading) {
    return <HeatMapSkeleton />;
  }

  const cells = buildGrid(days);

  return (
    <div className="heat-map" role="img" aria-label="Activity over the last 12 weeks">
      <div className="heat-map-grid">
        {cells.map((cell) => (
          <span
            key={cell.key}
            className={`heat-map-cell ${levelClass(cell.count)}${cell.isToday ? ' heat-map-cell-today' : ''}`}
            title={`${cell.key}: ${cell.count} vouch${cell.count === 1 ? '' : 'es'}`}
          />
        ))}
      </div>
      <div className="heat-map-legend">
        <span className="heat-map-legend-label">Less</span>
        <div className="heat-map-legend-scale">
          <span className="heat-map-cell" />
          <span className="heat-map-cell heat-map-cell-l1" />
          <span className="heat-map-cell heat-map-cell-l2" />
          <span className="heat-map-cell heat-map-cell-l3" />
        </div>
        <span className="heat-map-legend-label">More</span>
      </div>
    </div>
  );
}

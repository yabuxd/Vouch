const WEEKS = 12;
const DAYS = 7;

type Props = {
  weeks?: number;
  'aria-label'?: string;
};

export function HeatMapSkeleton({ weeks = WEEKS, 'aria-label': ariaLabel = 'Loading activity heat map' }: Props) {
  return (
    <div className="heat-map" aria-busy="true" aria-label={ariaLabel}>
      <div className="heat-map-grid heat-map-grid-skeleton" aria-hidden>
        {Array.from({ length: weeks * DAYS }, (_, i) => (
          <span key={i} className="heat-map-cell heat-map-cell-skeleton" />
        ))}
      </div>
      <div className="heat-map-legend heat-map-legend-skeleton" aria-hidden>
        <span className="heat-map-legend-label heat-map-shimmer" />
        <div className="heat-map-legend-scale">
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i} className="heat-map-cell heat-map-cell-skeleton heat-map-cell-skeleton-sm" />
          ))}
        </div>
      </div>
    </div>
  );
}

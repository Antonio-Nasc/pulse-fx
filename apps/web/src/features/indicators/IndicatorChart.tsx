import {
  formatIndicatorValue,
  formatReferenceDate,
} from './indicator-formatters';
import type { IndicatorObservation } from './indicator-types';

type IndicatorChartProps = {
  observations: IndicatorObservation[];
  unit: string;
};

const chartWidth = 800;
const chartHeight = 280;
const horizontalPadding = 28;
const verticalPadding = 24;

export function IndicatorChart({
  observations,
  unit,
}: IndicatorChartProps) {
  if (observations.length === 0) {
    return (
      <div className="detail-chart detail-chart--empty">
        Histórico indisponível.
      </div>
    );
  }

  const values = observations.map(
    (observation) => observation.value,
  );
  const minimumValue = Math.min(...values);
  const maximumValue = Math.max(...values);
  const valueRange = maximumValue - minimumValue || 1;

  const usableWidth = chartWidth - horizontalPadding * 2;
  const usableHeight = chartHeight - verticalPadding * 2;

  const points = observations.map((observation, index) => {
    const x =
      observations.length === 1
        ? chartWidth / 2
        : horizontalPadding +
          (index / (observations.length - 1)) * usableWidth;

    const y =
      verticalPadding +
      ((maximumValue - observation.value) / valueRange) *
        usableHeight;

    return {
      x,
      y,
      observation,
    };
  });

  const polylinePoints = points
    .map(({ x, y }) => `${x},${y}`)
    .join(' ');

  const areaPoints = [
    `${points[0].x},${chartHeight - verticalPadding}`,
    polylinePoints,
    `${points.at(-1)?.x},${chartHeight - verticalPadding}`,
  ].join(' ');

  const latestPoint = points.at(-1);

  return (
    <figure className="detail-chart">
      <div className="detail-chart__header">
        <div>
          <span>Intervalo observado</span>
          <strong>
            {formatIndicatorValue(minimumValue)} —{' '}
            {formatIndicatorValue(maximumValue)} {unit}
          </strong>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        role="img"
        aria-label={`Evolução histórica de ${formatIndicatorValue(
          minimumValue,
        )} até ${formatIndicatorValue(maximumValue)} ${unit}`}
      >
        <defs>
          <linearGradient
            id="indicator-area-gradient"
            x1="0"
            x2="0"
            y1="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="#147a50"
              stopOpacity="0.24"
            />
            <stop
              offset="100%"
              stopColor="#147a50"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((position) => {
          const y =
            verticalPadding + position * usableHeight;

          return (
            <line
              className="detail-chart__grid-line"
              x1={horizontalPadding}
              x2={chartWidth - horizontalPadding}
              y1={y}
              y2={y}
              key={position}
            />
          );
        })}

        <polygon
          className="detail-chart__area"
          points={areaPoints}
        />

        <polyline
          className="detail-chart__line"
          points={polylinePoints}
        />

        {latestPoint && (
          <circle
            className="detail-chart__latest-point"
            cx={latestPoint.x}
            cy={latestPoint.y}
            r="5"
          />
        )}
      </svg>

      <figcaption className="detail-chart__dates">
        <span>
          {formatReferenceDate(
            observations[0].referenceDate,
          )}
        </span>
        <span>
          {formatReferenceDate(
            observations.at(-1)?.referenceDate ?? null,
          )}
        </span>
      </figcaption>
    </figure>
  );
}
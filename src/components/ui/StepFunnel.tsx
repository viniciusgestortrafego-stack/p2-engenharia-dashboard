"use client";

interface StepFunnelProps {
  steps: {
    label: string;
    value: string | number;
    subtext?: string;
    percentage: number;
  }[];
}

// Ordinal ramp (one hue, light -> dark) so the color itself shows progression
// through the funnel, per the data-viz palette's "ordinal" rule for staged data.
const ORDINAL_RAMP = ["#86b6ef", "#6da7ec", "#5598e7", "#3987e5", "#2a78d6", "#256abf", "#1c5cab"];

function rampColorFor(index: number, total: number): string {
  const position = total > 1 ? index / (total - 1) : 0;
  const rampIndex = Math.round(position * (ORDINAL_RAMP.length - 1));
  return ORDINAL_RAMP[rampIndex];
}

function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Real funnel drop-offs are often extreme (thousands -> a handful), which makes a
// literal linear width collapse the bottom steps into invisible slivers. Square-root
// compression keeps the bars monotonically ordered (still reads as a funnel) while
// keeping every step visible; the exact numbers stay accurate in the text labels.
function displayWidthFor(percentage: number): number {
  const clamped = Math.min(100, Math.max(0, percentage));
  return Math.max(12, Math.sqrt(clamped) * 10);
}

export function StepFunnel({ steps }: StepFunnelProps) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const color = rampColorFor(index, steps.length);
        return (
          <div key={index} className="relative h-14 rounded-lg border border-card-border overflow-hidden flex items-center px-4 justify-between" style={{ marginLeft: `${index * 16}px`, backgroundColor: hexToRgba(color, 0.14) }}>
            {index > 0 && (
              <div className="absolute -left-4 top-1/2 w-4 border-t border-card-border"></div>
            )}
            {/* Progress bar background — proportional emphasis on top of the row's base tint */}
            <div
              className="absolute left-0 top-0 bottom-0 pointer-events-none transition-all duration-1000 ease-out"
              style={{ width: `${displayWidthFor(step.percentage)}%`, backgroundColor: hexToRgba(color, 0.4) }}
            ></div>
            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: color }}></div>

            <div className="relative z-10 flex flex-col">
              <span className="font-bold text-primary text-xs uppercase tracking-wider">
                {String(index + 1).padStart(2, '0')}. {step.label}
              </span>
            </div>
            <div className="relative z-10 flex flex-col items-end">
              <span className="font-bold text-foreground">{step.value}</span>
              {step.subtext && <span className="text-xs text-primary font-bold">{step.subtext}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

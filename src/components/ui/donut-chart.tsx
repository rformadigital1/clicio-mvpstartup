interface DonutChartProps {
  value: number
  max: number
  size?: number
  colors?: [string, string]
  formatter?: (value: number, max: number) => string
}

export function DonutChart({
  value,
  max,
  size = 80,
  colors = ["hsl(var(--primary))", "hsl(var(--warning))"],
  formatter,
}: DonutChartProps) {
  const pct = max > 0 ? (value / max) * 100 : 0

  if (max === 0) {
    return (
      <div
        className="rounded-full bg-muted shrink-0 flex items-center justify-center text-xs text-muted-foreground"
        style={{ width: size, height: size }}
      >
        Sin datos
      </div>
    )
  }

  return (
    <div
      className="rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${colors[0]} 0% ${pct}%, ${colors[1]} ${pct}% 100%)`,
      }}
      title={formatter?.(value, max) ?? `${value}/${max}`}
    />
  )
}

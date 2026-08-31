import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { useMounted } from "@/hooks/use-online";
import { ChartSkeleton } from "@/components/lifeos/states";
import { areaVar } from "@/components/lifeos/area";
import type { LifeArea } from "@/lib/types";
import { cn } from "@/lib/utils";

const axis = {
  stroke: "var(--border-strong)",
  tick: { fill: "var(--muted-foreground)", fontSize: 11 },
  tickLine: false,
  axisLine: false,
};

function Frame({
  children,
  summary,
  label,
  height = 220,
  className,
}: {
  children: ReactNode;
  summary: string;
  label: string;
  height?: number;
  className?: string;
}) {
  const mounted = useMounted();
  return (
    <figure className={cn("m-0", className)}>
      <div role="img" aria-label={`${label}. ${summary}`} style={{ height }}>
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            {children as never}
          </ResponsiveContainer>
        ) : (
          <ChartSkeleton height={height} />
        )}
      </div>
      <figcaption className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {summary}
      </figcaption>
    </figure>
  );
}

function TooltipCard({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | null; color?: string; dataKey?: string }[];
  label?: string;
  formatter?: (entry: { name?: string; value?: number | null; dataKey?: string }) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 text-popover-foreground">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="num flex items-center gap-2 text-muted-foreground">
          <span
            aria-hidden
            className="inline-block size-1.5 rounded-full"
            style={{ background: p.color }}
          />
          {formatter ? formatter(p) : `${p.name}: ${p.value ?? "—"}`}
        </p>
      ))}
    </div>
  );
}

export function AdherenceTrend({
  data,
  summary,
  height = 220,
}: {
  data: { label: string; rate: number; done: number; scheduled: number }[];
  summary: string;
  height?: number;
}) {
  return (
    <Frame label="Habit adherence over the last 60 days" summary={summary} height={height}>
      <AreaChart data={data} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
        <defs>
          <linearGradient id="fillRate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="2 4" />
        <XAxis dataKey="label" interval={9} {...axis} />
        <YAxis domain={[0, 100]} width={44} {...axis} unit="%" />
        <Tooltip
          cursor={{ stroke: "var(--border-strong)" }}
          content={
            <TooltipCard
              formatter={(p) => `${p.value ?? 0}% completed`}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="rate"
          name="Adherence"
          stroke="var(--primary)"
          strokeWidth={1.75}
          fill="url(#fillRate)"
          dot={false}
          activeDot={{ r: 3 }}
        />
      </AreaChart>
    </Frame>
  );
}

export function WeeklyBars({
  data,
  summary,
  height = 200,
}: {
  data: { label: string; rate: number; done: number; scheduled: number }[];
  summary: string;
  height?: number;
}) {
  return (
    <Frame label="Weekly habit completion" summary={summary} height={height}>
      <BarChart data={data} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="2 4" />
        <XAxis dataKey="label" {...axis} />
        <YAxis domain={[0, 100]} width={44} {...axis} unit="%" />
        <Tooltip
          cursor={{ fill: "var(--accent)" }}
          content={<TooltipCard formatter={(p) => `${p.value ?? 0}% of scheduled habits`} />}
        />
        <Bar dataKey="rate" name="Completion" fill="var(--area-health)" radius={[3, 3, 0, 0]} maxBarSize={26} />
      </BarChart>
    </Frame>
  );
}

export function MoodEnergyChart({
  data,
  summary,
  height = 200,
}: {
  data: { label: string; mood: number | null; energy: number | null }[];
  summary: string;
  height?: number;
}) {
  return (
    <Frame label="Mood and energy over the last 30 days" summary={summary} height={height}>
      <LineChart data={data} margin={{ top: 6, right: 6, left: -28, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="2 4" />
        <XAxis dataKey="label" interval={5} {...axis} />
        <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} width={40} {...axis} />
        <Tooltip
          cursor={{ stroke: "var(--border-strong)" }}
          content={<TooltipCard formatter={(p) => `${p.name}: ${p.value ?? "no entry"}`} />}
        />
        <Line
          type="monotone"
          dataKey="mood"
          name="Mood"
          stroke="var(--area-mind)"
          strokeWidth={1.75}
          dot={false}
          connectNulls={false}
        />
        <Line
          type="monotone"
          dataKey="energy"
          name="Energy"
          stroke="var(--area-money)"
          strokeWidth={1.75}
          strokeDasharray="3 3"
          dot={false}
          connectNulls={false}
        />
      </LineChart>
    </Frame>
  );
}

export function AreaBalanceChart({
  data,
  summary,
  height = 240,
}: {
  data: { label: string; value: number }[];
  summary: string;
  height?: number;
}) {
  return (
    <Frame label="Attention spread across life areas" summary={summary} height={height}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
        <Tooltip content={<TooltipCard formatter={(p) => `Weighted activity: ${p.value ?? 0}`} />} />
        <Radar
          dataKey="value"
          name="Activity"
          stroke="var(--primary)"
          strokeWidth={1.5}
          fill="var(--primary)"
          fillOpacity={0.14}
        />
      </RadarChart>
    </Frame>
  );
}

/** Calendar-style completion grid. Keyboard reachable, described in text. */
export function HabitHeatmap({
  days,
  area,
  summary,
}: {
  days: { date: string; state: "done" | "missed" | "off" }[];
  area: LifeArea;
  summary: string;
}) {
  const weeks: (typeof days)[] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return (
    <figure className="m-0">
      <div className="flex gap-1 overflow-x-auto pb-1" role="img" aria-label={summary}>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((d) => (
              <span
                key={d.date}
                title={`${format(parseISO(d.date), "EEE d MMM")} — ${
                  d.state === "done" ? "completed" : d.state === "missed" ? "missed" : "not scheduled"
                }`}
                className="size-3 rounded-[3px] border border-border"
                style={{
                  background:
                    d.state === "done"
                      ? areaVar[area]
                      : d.state === "missed"
                        ? "var(--muted)"
                        : "transparent",
                  opacity: d.state === "off" ? 0.35 : 1,
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <figcaption className="mt-3 text-xs text-muted-foreground">{summary}</figcaption>
    </figure>
  );
}

export function Sparkline({ data, color = "var(--primary)" }: { data: { rate: number }[]; color?: string }) {
  const mounted = useMounted();
  if (!mounted) return <div className="h-8 w-full rounded bg-muted" aria-hidden />;
  return (
    <div className="h-8 w-full" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <Line type="monotone" dataKey="rate" stroke={color} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

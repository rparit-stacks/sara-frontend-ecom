import {
  AreaChart, Area, Line, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar, BarChart, Bar, LabelList,
} from 'recharts';
import { THEME_3D, paletteColor } from './theme3d';

/** Shared tooltip styling so all charts match the theme. */
const tooltipStyle = {
  contentStyle: {
    borderRadius: 12,
    border: '1px solid hsl(var(--border))',
    background: '#fff',
    fontSize: 12,
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  },
};

// ---------------------------------------------------------------------------
// Revenue: area (revenue) + line (orders) with grid, axes, tooltip
// ---------------------------------------------------------------------------
export interface RevenueChartPoint { label: string; revenue: number; orders: number; }

export function RevenueChart({ data }: { data: RevenueChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={THEME_3D.primary} stopOpacity={0.35} />
            <stop offset="100%" stopColor={THEME_3D.primary} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef1f1" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: THEME_3D.foreground }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: THEME_3D.foreground }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : `${v}`)}
        />
        <Tooltip
          {...tooltipStyle}
          formatter={(value: number, name: string) =>
            name === 'revenue' ? [`₹${value.toLocaleString('en-IN')}`, 'Revenue'] : [value, 'Orders']
          }
        />
        <Area type="monotone" dataKey="revenue" stroke={THEME_3D.primary} strokeWidth={2.5} fill="url(#revFill)" />
        <Line type="monotone" dataKey="orders" stroke={THEME_3D.primaryDark} strokeWidth={2} strokeDasharray="5 4" dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Top Categories: donut with center total + percentage labels
// ---------------------------------------------------------------------------
export interface DonutDatum { name: string; value: number; }

export function CategoryDonut({ data }: { data: DonutDatum[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="58%"
          outerRadius="82%"
          paddingAngle={2}
          stroke="none"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={paletteColor(i)} />
          ))}
        </Pie>
        <Tooltip
          {...tooltipStyle}
          formatter={(value: number, name: string) => [
            `₹${value.toLocaleString('en-IN')} (${total ? ((value / total) * 100).toFixed(1) : 0}%)`,
            name,
          ]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Monthly Target: radial gauge
// ---------------------------------------------------------------------------
export function RadialGauge({ percent }: { percent: number }) {
  const data = [{ name: 'achieved', value: Math.max(0, Math.min(percent, 100)), fill: THEME_3D.primary }];
  return (
    <div className="relative w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="70%"
          outerRadius="100%"
          data={data}
          startAngle={210}
          endAngle={-30}
          barSize={18}
        >
          {/* track */}
          <RadialBar background={{ fill: '#eef1f1' }} dataKey="value" cornerRadius={10} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-4xl font-bold" style={{ color: THEME_3D.foreground }}>
          {Math.round(percent)}%
        </span>
        <span className="text-xs text-muted-foreground">achieved</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Conversion: horizontal funnel bars (descending), estimated bars faded
// ---------------------------------------------------------------------------
export interface FunnelDatum { name: string; value: number; estimated?: boolean; }

export function ConversionFunnel({ data }: { data: FunnelDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 48, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef1f1" horizontal={false} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={130}
          tick={{ fontSize: 11, fill: THEME_3D.foreground }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip {...tooltipStyle} formatter={(value: number) => [value.toLocaleString(), 'Count']} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
          {data.map((d, i) => (
            <Cell key={i} fill={paletteColor(i)} fillOpacity={d.estimated ? 0.5 : 1} />
          ))}
          <LabelList dataKey="value" position="right" formatter={(v: number) => v.toLocaleString()} style={{ fontSize: 11, fill: THEME_3D.foreground }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Traffic sources: horizontal percent bars
// ---------------------------------------------------------------------------
export interface TrafficDatum { name: string; percent: number; }

// ---------------------------------------------------------------------------
// Signups over time: simple line
// ---------------------------------------------------------------------------
export function SignupLine({ data }: { data: { label: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="signupFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={THEME_3D.primary} stopOpacity={0.3} />
            <stop offset="100%" stopColor={THEME_3D.primary} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef1f1" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: THEME_3D.foreground }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: THEME_3D.foreground }} axisLine={false} tickLine={false} />
        <Tooltip {...tooltipStyle} formatter={(v: number) => [v, 'Signups']} />
        <Area type="monotone" dataKey="count" stroke={THEME_3D.primary} strokeWidth={2.5} fill="url(#signupFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Sales heatmap: day-of-week x hour grid (CSS, not Recharts)
// ---------------------------------------------------------------------------
export function HeatmapGrid({ days }: { days: { day: string; hours: number[] }[] }) {
  const max = Math.max(1, ...days.flatMap((d) => d.hours));
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[520px]">
        {/* hour header (every 3h) */}
        <div className="flex items-center gap-[2px] pl-9 mb-1">
          {Array.from({ length: 24 }).map((_, h) => (
            <div key={h} className="flex-1 text-center text-[9px] text-muted-foreground">{h % 3 === 0 ? h : ''}</div>
          ))}
        </div>
        {days.map((d) => (
          <div key={d.day} className="flex items-center gap-[2px] mb-[2px]">
            <div className="w-8 text-[10px] font-medium text-muted-foreground">{d.day}</div>
            {d.hours.map((v, h) => (
              <div
                key={h}
                title={`${d.day} ${h}:00 — ${v} orders`}
                className="flex-1 aspect-square rounded-[2px]"
                style={{ background: v === 0 ? '#f1f4f4' : THEME_3D.primary, opacity: v === 0 ? 1 : 0.25 + (v / max) * 0.75 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrafficBars({ data }: { data: TrafficDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 4 }}>
        <XAxis type="number" hide domain={[0, 100]} />
        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: THEME_3D.foreground }} axisLine={false} tickLine={false} />
        <Tooltip {...tooltipStyle} formatter={(value: number) => [`${value.toFixed(1)}%`, 'Share']} />
        <Bar dataKey="percent" radius={[0, 6, 6, 0]} barSize={18}>
          {data.map((_, i) => (
            <Cell key={i} fill={paletteColor(i)} />
          ))}
          <LabelList dataKey="percent" position="right" formatter={(v: number) => `${v.toFixed(0)}%`} style={{ fontSize: 11, fill: THEME_3D.foreground }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

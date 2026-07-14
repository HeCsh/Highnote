import { Bar, BarChart, Cell, LabelList, ReferenceLine, ResponsiveContainer, XAxis } from "recharts";

export interface WeekBar {
  label: string;
  count: number;
  live: number;
}

/** "Reviews per week" — 6 bars, current week highlighted, "QR live" marker. */
export default function WeekChart({ data }: { data: WeekBar[] }) {
  // Mark where live capture began: the first week (from oldest) that has live rows.
  const liveStart = data.findIndex((d) => d.live > 0);
  const markerLabel = data[liveStart]?.label;

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 18, right: 8, left: 8, bottom: 4 }}>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#8ba392", fontSize: 11 }}
          />
          {markerLabel && (
            <ReferenceLine
              x={markerLabel}
              stroke="#f2b441"
              strokeDasharray="3 3"
              label={{ value: "QR live", position: "top", fill: "#f2b441", fontSize: 10 }}
            />
          )}
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={38}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === data.length - 1 ? "#f2b441" : "#7fa98b"} />
            ))}
            <LabelList dataKey="count" position="top" fill="#cddccf" fontSize={11} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

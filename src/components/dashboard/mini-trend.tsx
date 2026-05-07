"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";

export function MiniTrend({ values, color }: { values: number[]; color: string }) {
  const data = values.map((value, index) => ({ index, value }));

  return (
    <div className="h-8 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 2, bottom: 4, left: 2 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

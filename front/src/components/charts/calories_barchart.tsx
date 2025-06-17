"use client";

import { useEffect, useRef } from "react";
import * as vl from "vega-lite-api";
import embed from "vega-embed";

// Só um teste, dps a gente se reune e conversa os gráficos certinhos e o que a gente vai querer fazer
interface CaloriesBarChartProps {
  data: { Name: string; calories: number }[];
}

export default function CaloriesBarChart({ data }: CaloriesBarChartProps) {
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const top10 = [...data]
      .filter((d) => d.calories && !isNaN(d.calories))
      .sort((a, b) => b.calories - a.calories)
      .slice(0, 10);

    const spec = vl
      .markBar({ color: "teal" })
      .data(top10)
      .encode(
        vl.x().fieldQ("calories").title("Calorias"),
        vl.y().fieldN("Name").sort("-x").title("Receita")
      )
      .width(840)
      .height(300)
      .toSpec();

    embed(chartRef.current, spec, { actions: false });
  }, [data]);

  return <div ref={chartRef} />;
}

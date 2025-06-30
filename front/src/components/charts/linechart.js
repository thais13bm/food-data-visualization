"use client";

import { useEffect, useRef, useState } from "react";
import * as vl from "vega-lite-api";
import embed from "vega-embed";

export default function LineChart({ data }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const margin = { left: 20, right: 20 };
  const height = 600;

  useEffect(() => {
    const resize = () => {
      if (containerRef.current) {
        const width =
          containerRef.current.getBoundingClientRect().width -
          margin.left -
          margin.right -
          50;
        setContainerWidth(width);
      }
    };

    resize();

    const observer = new ResizeObserver(resize);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!chartRef.current || containerWidth === 0) return;

    // Extrai o ano de cada receita
    const yearCounts = {};
    data.forEach((d) => {
      if (d.DatePublished) {
        const year = d.DatePublished.slice(0, 4);
        if (year.match(/^\d{4}$/)) {
          yearCounts[year] = (yearCounts[year] || 0) + 1;
        }
      }
    });

    // Transforma em array ordenado por ano
    const yearData = Object.entries(yearCounts)
      .map(([year, count]) => ({ year: +year, count }))
      .sort((a, b) => a.year - b.year);

    const spec = vl
      .markLine({ point: true })
      .data(yearData)
      .encode(
        vl.x().fieldN("year").title("Year"),
        vl.y().fieldQ("count").title("Number of Recipes"),
        vl.tooltip([
          { field: "year", title: "Year" },
          { field: "count", title: "Recipes" },
        ])
      )
      .width(containerWidth)
      .height(height)
      .toSpec();

    embed(chartRef.current, spec, {
      actions: false,
      renderer: "svg",
      defaultStyle: true,
    });
  }, [data, containerWidth]);

  return (
    <div ref={containerRef} className="w-full" style={{ height }}>
      <div ref={chartRef} className="w-full h-full" />
    </div>
  );
}
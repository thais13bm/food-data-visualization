"use client";

import { useEffect, useRef } from "react";
import * as vl from "vega-lite-api";
import embed from "vega-embed";

export default function ScatterPlot({
  data,
  selectedCategories,
  xField,
  yField,
}) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const allCategories = [
      ...new Set(data.map((d) => d.RecipeCategory)),
    ].sort();

    const activeCategories = selectedCategories.includes("All")
      ? allCategories
      : selectedCategories;

    const filtered = data
      .filter((d) => d[xField] !== undefined && !isNaN(d[xField]))
      .filter((d) => d[yField] !== undefined && !isNaN(d[yField]))
      .filter((d) => activeCategories.includes(d.RecipeCategory));

    const top = [...filtered].sort((a, b) => b[xField] - a[xField]);

    const spec = vl
      .markPoint()
      .data(top)
      .encode(
        vl.x().fieldQ(xField).title(xField),
        vl.y().fieldQ(yField).title(yField),
        vl.color().fieldN("RecipeCategory").title("Category").legend({
          symbolLimit: 20,
          columns: 1,
        }),
        vl.tooltip([
          { field: "Name", title: "Recipe" },
          { field: "AuthorName", title: "Author" },
          { field: xField, title: xField },
          { field: yField, title: yField },
        ])
      )
      .width(600)
      .height(400)
      .toSpec();

    embed(chartRef.current, spec, { actions: false });
  }, [data, selectedCategories, xField, yField]);

  return <div ref={chartRef} />;
}

"use client";

import { useEffect, useRef } from "react";
import * as vl from "vega-lite-api";
import embed from "vega-embed";

export default function BarChart({ data, selectedCategories, topN }) {
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
      .filter((d) => d.Calories && !isNaN(d.Calories))
      .filter((d) => activeCategories.includes(d.RecipeCategory));

    const top = [...filtered]
      .sort((a, b) => b.Calories - a.Calories)
      .slice(0, topN);

    const spec = vl
      .markBar()
      .data(top)
      .encode(
        vl.x().fieldQ("Calories").title("Calorias"),
        vl.y().fieldN("Name").sort("-x").title("Receita"),
        vl.color().fieldN("RecipeCategory").title("Categoria"),
        vl.tooltip([
          { field: "AuthorName", title: "Autor" },
          { field: "Description", title: "Descrição" },
        ])
      )
      .width(600)
      .height(40 * top.length)
      .toSpec();

    embed(chartRef.current, spec, { actions: false });
  }, [data, selectedCategories, topN]);

  return <div ref={chartRef} />;
}

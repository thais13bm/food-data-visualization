"use client";

import { useEffect, useRef, useState } from "react";
import * as vl from "vega-lite-api";
import embed from "vega-embed";
import { LoadingOverlay } from "@/components/common/loading-overlay";

export default function BarChart({
  data,
  selectedCategories,
  topN,
  xField,
  ascending = false,
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const height = topN * 35;
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    const resize = () => {
      if (containerRef.current) {
        const width = containerRef.current.getBoundingClientRect().width;
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
    setChartLoading(true);

    const allCategories = [
      ...new Set(data.map((d) => d.RecipeCategory)),
    ].sort();
    const activeCategories = selectedCategories.includes("All")
      ? allCategories
      : selectedCategories;

    const filtered = data
      .filter((d) => d[xField] && !isNaN(d[xField]))
      .filter((d) => activeCategories.includes(d.RecipeCategory));

    // 1. Calcular média de xField por categoria
    const categoryMeansAll = Object.entries(
      filtered.reduce((acc, curr) => {
        const cat = curr.RecipeCategory;
        const value = Number(curr[xField]);
        if (isNaN(value)) return acc;

        if (!acc[cat]) acc[cat] = { sum: 0, count: 0 };
        acc[cat].sum += value;
        acc[cat].count += 1;
        return acc;
      }, {})
    ).map(([category, { sum, count }]) => ({
      RecipeCategory: category,
      mean: sum / count,
    }));

    // 2. Ordenar categorias pelas médias
    const categoryMeansSorted = [...categoryMeansAll].sort((a, b) =>
      ascending ? a.mean - b.mean : b.mean - a.mean
    );

    // 3. Selecionar top N categorias
    const topCategories = categoryMeansSorted.slice(0, topN);



    const spec = vl
      .markBar()
      .data(topCategories)
      .encode(
        vl.x().fieldQ("mean").title(`Mean ${xField}`),
        vl.y().fieldN("RecipeCategory").sort(ascending ? "x" : "-x").title("Category"),
        vl.color().fieldN("RecipeCategory").legend(null), // remove legenda redundante
        vl.tooltip([
          { field: "RecipeCategory", title: "Category" },
          { field: "mean", title: `Mean ${xField}`, format: ".1f", },
        ])
      )
      .width(containerWidth)
      .height(height)
      .autosize({ type: "fit", contains: "padding" })
      .config({
        padding: { left: 20, right: 10, bottom: 10, top: 10 },
      })
      .toSpec();


    embed(chartRef.current, spec, {
      actions: false,
      renderer: "svg",
      defaultStyle: true,
    }).then(() => {
      setChartLoading(false);
    });
  }, [data, selectedCategories, topN, xField, containerWidth]);

  return (
    <div ref={containerRef} className="w-full relative" style={{ height }}>
      {chartLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
          <LoadingOverlay variant="neutral" />
        </div>
      )}
      <div ref={chartRef} className="w-full h-full" />
    </div>
  );
}

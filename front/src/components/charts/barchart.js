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
  const [chartLoading, setChartLoading] = useState(true);

  const containerMaxHeight = 350; // altura fixa do "card"
  const minBarHeight = 40; // altura mínima que uma barra deve ter

  // Calcula altura do gráfico baseado no número de barras e mantendo altura mínima da barra
  const calculatedBarHeight =
    topN > 0 ? containerMaxHeight / topN : containerMaxHeight;
  const barHeight =
    calculatedBarHeight < minBarHeight ? minBarHeight : calculatedBarHeight;

  // Se a barra mínima for atingida, aumentamos a altura total do gráfico
  const chartHeight = barHeight * topN;

  useEffect(() => {
    const resize = () => {
      if (containerRef.current) {
        const width = containerRef.current.getBoundingClientRect().width - 30;
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

    const bestRecipePerCategory = {};

    for (const recipe of filtered) {
      const cat = recipe.RecipeCategory;
      const value = Number(recipe[xField]);

      if (isNaN(value)) continue;

      if (
        !bestRecipePerCategory[cat] ||
        value > bestRecipePerCategory[cat].value
      ) {
        let imageUrl = "";
        try {
          const parsed = JSON.parse(recipe.Images.replace(/'/g, '"'));
          imageUrl = Array.isArray(parsed) ? parsed[0] : parsed;
        } catch {
          imageUrl = recipe.Images.replace(/['"]/g, "");
        }

        bestRecipePerCategory[cat] = { value, image: imageUrl };
      }
    }

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
      Count: count,
      image: bestRecipePerCategory[category]?.image || "",
    }));

    const categoryMeansSorted = [...categoryMeansAll].sort((a, b) =>
      ascending ? a.mean - b.mean : b.mean - a.mean
    );

    const topCategories = categoryMeansSorted.slice(0, topN);

    const spec = vl
      .markBar({ size: barHeight * 0.8 }) // Controla a altura da barra (80% do espaço da barra)
      .data(topCategories)
      .encode(
        vl.x().fieldQ("mean").title(`Mean ${xField}`),
        vl
          .y()
          .fieldN("RecipeCategory")
          .sort(ascending ? "x" : "-x")
          .title("Category"),
        vl.color().fieldN("RecipeCategory").legend(null),
        vl.tooltip([
          { field: "RecipeCategory", title: "Category" },
          { field: "mean", title: `Mean ${xField}`, format: ".1f" },
          { field: "Count", title: "Number of Recipes" },
          { field: "image" },
        ])
      )
      .width(containerWidth)
      .height(chartHeight)
      .autosize({ type: "fit", contains: "padding" })
      .config({
        padding: { left: 20, right: 10, bottom: 10, top: 10 },
        bar: { continuousBandSize: barHeight * 0.8 }, // Define a largura da banda vertical
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
    <div
      ref={containerRef}
      className="w-full relative overflow-y-auto"
      style={{ maxHeight: containerMaxHeight }}
    >
      {chartLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
          <LoadingOverlay variant="neutral" />
        </div>
      )}
      <div
        ref={chartRef}
        className="w-full"
        style={{ height: chartHeight, minHeight: chartHeight }}
      />
    </div>
  );
}

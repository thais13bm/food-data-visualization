"use client";

import { useEffect, useRef, useState } from "react";
import * as vl from "vega-lite-api";
import embed from "vega-embed";
import { LoadingOverlay } from "@/components/common/loading-overlay";

export default function ScatterPlot({
  data,
  selectedCategories,
  xField,
  yField,
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [chartLoading, setChartLoading] = useState(true);

  const margin = { left: 20, right: 20 };
  const height = 350;

  useEffect(() => {
    console.log("ScatterPlot - primeiro loading");
    const resize = () => {
      if (containerRef.current) {
        const width =
          containerRef.current.getBoundingClientRect().width -
          margin.left -
          margin.right -
          120; // legenda
        setContainerWidth(width);
      }
    };

    resize();

    const observer = new ResizeObserver(resize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

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
      .filter((d) => d[xField] !== undefined && !isNaN(d[xField]))
      .filter((d) => d[yField] !== undefined && !isNaN(d[yField]))
      .filter((d) => activeCategories.includes(d.RecipeCategory));

    const imageMap = {};
    for (const recipe of filtered) {
      if (!imageMap[recipe.RecipeCategory]) {
        try {
          const parsed = JSON.parse(recipe.Images.replace(/'/g, '"'));
          const imageUrl = Array.isArray(parsed) ? parsed[0] : parsed;
          if (imageUrl) imageMap[recipe.RecipeCategory] = imageUrl;
        } catch {
          imageMap[recipe.RecipeCategory] = recipe.Images.replace(/['"]/g, "");
        }
      }
    }

    const categoryAgg = Object.entries(
      filtered.reduce((acc, curr) => {
        const cat = curr.RecipeCategory;
        const xVal = Number(curr[xField]);
        const yVal = Number(curr[yField]);
        if (isNaN(xVal) || isNaN(yVal)) return acc;

        if (!acc[cat]) {
          acc[cat] = { xSum: 0, ySum: 0, count: 0 };
        }
        acc[cat].xSum += xVal;
        acc[cat].ySum += yVal;
        acc[cat].count += 1;

        return acc;
      }, {})
    ).map(([category, { xSum, ySum, count }]) => ({
      RecipeCategory: category,
      [`mean_${xField}`]: xSum / count,
      [`mean_${yField}`]: ySum / count,
      Count: count,
      image: imageMap[category] || "",
    }));

    const spec = {
      data: { values: categoryAgg },
      width: containerWidth,
      height: height,
      mark: "point",
      encoding: {
        x: {
          field: `mean_${xField}`,
          type: "quantitative",
          title: `Mean ${xField}`,
        },
        y: {
          field: `mean_${yField}`,
          type: "quantitative",
          title: `Mean ${yField}`,
        },
        color: {
          field: "RecipeCategory",
          type: "nominal",
          legend: { title: "Category" },
        },
        tooltip: [
          { field: "RecipeCategory", title: "Category" },
          { field: `mean_${xField}`, title: `Mean ${xField}`, format: ".1f" },
          { field: `mean_${yField}`, title: `Mean ${yField}`, format: ".1f" },
          { field: "Count", title: "Number of Recipes" },
          { field: "image" },
        ],
      },
    };

    embed(chartRef.current, spec, {
      actions: false,
      renderer: "svg",
      defaultStyle: true,
    }).then(() => {
      setChartLoading(false);
    });
  }, [data, selectedCategories, xField, yField, containerWidth]);

  return (
    <div ref={containerRef} className="w-full h-[400px] relative">
      {chartLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
          <LoadingOverlay variant="neutral" />
        </div>
      )}
      <div ref={chartRef} className="w-full h-full" />
    </div>
  );
}

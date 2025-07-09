"use client";

import { useEffect, useRef, useState } from "react";
import embed from "vega-embed";
import * as d3 from "d3";
import { LoadingOverlay } from "@/components/common/loading-overlay";

export default function ParallelCoordinatesChart({ data, selectedCategories }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [chartLoading, setChartLoading] = useState(true);
  const height = 300;

  const metrics = [
    "Calories (kcal)",
    "FatContent (g)",
    "CarbohydrateContent (g)",
    "SugarContent (g)",
    "ProteinContent (g)",
  ];

  useEffect(() => {
    const resize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.getBoundingClientRect().width);
      }
    };
    resize();

    const observer = new ResizeObserver(resize);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!chartRef.current || containerWidth === 0 || !data) return;

    setChartLoading(true);

    const allCategories = Array.from(
      new Set(data.map((d) => d.RecipeCategory))
    ).sort();
    const selected = selectedCategories.includes("All")
      ? allCategories
      : selectedCategories;

    const filtered = data
      .filter((d) => selected.includes(d.RecipeCategory))
      .filter((d) => metrics.every((m) => d[m] !== undefined && !isNaN(+d[m])));

    const averages = selected.map((category) => {
      const items = filtered.filter((d) => d.RecipeCategory === category);
      const entry = { RecipeCategory: category };
      metrics.forEach((m) => {
        entry[m] = d3.mean(items, (d) => +d[m]) || 0;
      });
      return entry;
    });

   const VLspec = {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      description: "Parallel Coordinates Chart",
      data: { values: averages },
      vconcat: [
        {
          transform: [
            { filter: "datum['Calories (kcal)']" },
            { window: [{ op: "count", as: "index" }] },
            { fold: metrics, as: ["key", "value"] },
            {
              joinaggregate: [
                { op: "max", field: "value", as: "max" },
              ],
              groupby: ["key"],
            },
            {
              calculate: "datum.max === 0 ? 0 : datum.value / datum.max",
              as: "norm_val",
            },
            {
              calculate: "datum.max / 2",
              as: "mid",
            },
          ],
          width: containerWidth,
          height: height,
          layer: [
            {
              mark: { type: "rule", color: "#ccc" },
              encoding: {
                detail: { aggregate: "count" },
                x: {
                  field: "key",
                  axis: {
                    labelFontSize: 14,
                    labelAngle: 0,
                    domain: false,
                    title: null,
                  },
                },
              },
            },
            {
              mark: "line",
              encoding: {
                color: {
                  type: "nominal",
                  field: "RecipeCategory",
                  legend: {
                    title: "Category",
                    orient: "bottom",
                    symbolLimit: 10,
                  },
                },
                detail: { field: "index" },
                opacity: { value: 1 },
                x: { type: "nominal", field: "key" },
                y: {
                  labelFontSize: 14,
                  type: "quantitative",
                  field: "norm_val",
                  axis: null,
                },
                tooltip: metrics.map((m) => ({
                  field: m,
                  type: "quantitative",
                  title: m,
                })),
              },
            },
            ...[0, 0.5, 1].map((pos) => ({
              encoding: {
                x: { type: "nominal", field: "key" },
                y: { value: height * pos },
              },
              layer: [
                {
                  mark: { type: "text", style: "label", align: "left", dx: 4 },
                  encoding: {
                    text:
                      pos === 0
                        ? { field: "max", type: "quantitative", format: ".1f" }
                        : pos === 0.5
                        ? { field: "mid", type: "quantitative", format: ".1f" }
                        : { value: "0" },
                  },
                },
                {
                  mark: { type: "tick", style: "tick", size: 8, color: "#ccc" },
                },
              ],
            })),
          ],
        },
      ],
      config: { view: { stroke: null } },
    };

    embed(chartRef.current, VLspec, {
      actions: false,
      renderer: "svg",
      defaultStyle: true,
    }).then(() => {
      setChartLoading(false);
    });
  }, [data, selectedCategories, containerWidth]);

  return (
    <div ref={containerRef} className="w-full relative pt-8" style={{ height }}>
      {chartLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
          <LoadingOverlay variant="neutral" />
        </div>
      )}
      <div ref={chartRef} className="w-full h-full" />
    </div>
  );
}

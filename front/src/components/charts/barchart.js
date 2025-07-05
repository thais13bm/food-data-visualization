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

    const top = [...filtered]
      .sort((a, b) =>
        ascending ? a[xField] - b[xField] : b[xField] - a[xField]
      )
      .slice(0, topN)
      .map((d) => {
        let imageUrl = "";

        // Temporário - depois a gente pode ajustar para uma imagem por receita no csv, pra evitar esse replace
        try {
          const parsed = JSON.parse(d.Images.replace(/'/g, '"'));
          if (Array.isArray(parsed) && parsed.length > 0) {
            imageUrl = parsed[0];
          } else if (typeof parsed === "string") {
            imageUrl = parsed;
          }
        } catch (err) {
          imageUrl = d.Images.replace(/['"]/g, "");
        }

        return {
          ...d,
          image: imageUrl,
        };
      });

    const spec = vl
      .markBar()
      .data(top)
      .encode(
        vl.x().fieldQ(xField).title(xField),
        vl
          .y()
          .fieldN("Name")
          .sort(ascending ? "x" : "-x")
          .title("Recipe"),

        vl.color().fieldN("RecipeCategory").title("Category"),
        vl.tooltip([
          { field: "Name", title: "Recipe" },
          { field: "RecipeCategory", title: "Category" },
          { field: "AuthorName", title: "Author" },
          { field: xField, title: xField },
          {
            field: "DatePublished",
            type: "temporal",
            title: "Published",
            format: "%d/%m/%Y",
          },
          { field: "image" },
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

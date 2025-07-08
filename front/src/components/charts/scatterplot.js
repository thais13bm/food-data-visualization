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

    const top = [...filtered]
      .sort((a, b) => b[xField] - a[xField])
      .map((d) => {
        let imageUrl = "";
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
          { field: "RecipeCategory", title: "Category" },
          { field: "AuthorName", title: "Author" },
          { field: xField, title: xField },
          { field: yField, title: yField },
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
      .toSpec();

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

"use client";

import { useEffect, useRef, useState } from "react";
import embed from "vega-embed";
import * as d3 from "d3";
import cloud from "d3-cloud";
import { LoadingOverlay } from "@/components/common/loading-overlay";

export default function RecipeDashboard({
  data,
  selectedCategories,
  xFieldBarChart,
  topN,
  ascending,
  xFieldScatter,
  yFieldScatter,
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const wordCloudRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [chartLoading, setChartLoading] = useState(true);

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
    if (!chartRef.current || containerWidth === 0) return;
    setChartLoading(true);

    const filtered = data.filter(
      (d) =>
        selectedCategories.includes(d.RecipeCategory) &&
        d["Calories (kcal)"] &&
        d["ProteinContent (g)"] &&
        d["FatContent (g)"]
    );

    const filteredWithImages = filtered.map((d) => {
      let imageUrl = "";
      try {
        const parsed = JSON.parse(d.Images.replace(/'/g, '"'));
        if (Array.isArray(parsed) && parsed.length > 0) {
          imageUrl = parsed[0];
        } else if (typeof parsed === "string") {
          imageUrl = parsed;
        }
      } catch {
        imageUrl = d.Images.replace(/['"]/g, "");
      }
      return { ...d, image: imageUrl };
    });

    const spec = {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      hconcat: [
        // BarChart
        {
          title: "Bar Chart",
          data: {
            values: [...filteredWithImages]
              .sort((a, b) =>
                ascending
                  ? a[xFieldBarChart] - b[xFieldBarChart]
                  : b[xFieldBarChart] - a[xFieldBarChart]
              )
              .slice(0, topN),
          },
          width: containerWidth / 3 - 15 - 100,
          height: 250,
          params: [
            {
              name: "selectPoint",
              select: { type: "point", fields: ["Name"] },
            },
          ],

          mark: "bar",
          encoding: {
            y: {
              field: "Name",
              type: "nominal",
              sort: ascending ? "x" : "-x",
              title: "Recipe",
            },
            x: {
              field: xFieldBarChart,
              type: "quantitative",
              title: xFieldBarChart,
            },
            color: {
              condition: {
                selection: "selectPoint",
                field: "RecipeCategory",
                type: "nominal",
              },
              value: "#ccc",
            },
            tooltip: [
              { field: "Name" },
              { field: "RecipeCategory" },
              { field: xFieldBarChart },
              {
                field: "DatePublished",
                type: "temporal",
                title: "Published",
                format: "%d/%m/%Y",
              },
              { field: "image" },
            ],
          },
        },

        // ScatterPlot
        {
          title: "Scatter Plot",
          data: { values: filteredWithImages },
          width: containerWidth / 3 - 15 -100,
          height: 250,
          // transform: [{ filter: { selection: "selectPoint" } }],
          params: [
            { name: "brush", select: { type: "interval", empty: "none" } },
          ],
          mark: "point",
          encoding: {
            x: { field: xFieldScatter, type: "quantitative" },
            y: { field: yFieldScatter, type: "quantitative" },
            color: {
              condition: {
                selection: "selectPoint",
                field: "RecipeCategory",
                type: "nominal",
              },
              value: "#ccc",
            },
            tooltip: [
              { field: "Name" },
              { field: xFieldScatter },
              { field: yFieldScatter },
              {
                field: "DatePublished",
                type: "temporal",
                title: "Published",
                format: "%d/%m/%Y",
              },
              { field: "image" },
            ],
          },
        },

        // Paralela
        {
          title: "Parallel Coordinates",
          data: { values: filteredWithImages },
          transform: [
            {
              calculate:
                "length(data('selectPoint_store')) > 0 || length(data('brush_store')) > 0 ? true : false",
              as: "hasSelection",
            },
            {
              filter: "datum.hasSelection",
            },
            { filter: { selection: "brush" } },
            { filter: { selection: "selectPoint" } },
            { window: [{ op: "count", as: "index" }] },
            {
              fold: [
                "Calories (kcal)",
                "FatContent (g)",
                "CarbohydrateContent (g)",
                "SugarContent (g)",
                "ProteinContent (g)",
              ],
              as: ["key", "value"],
            },
            {
              lookup: "key",
              from: {
                data: {
                  values: (() => {
                    const metrics = [
                      "Calories (kcal)",
                      "FatContent (g)",
                      "CarbohydrateContent (g)",
                      "SugarContent (g)",
                      "ProteinContent (g)",
                    ];
                    return metrics.map((m) => {
                      const values = filteredWithImages
                        .map((d) => +d[m])
                        .filter((v) => !isNaN(v));
                      const min = d3.min(values) ?? 0;
                      const max = d3.max(values) ?? 0;
                      const mid = (min + max) / 2;
                      return { key: m, min, max, mid };
                    });
                  })(),
                },
                key: "key",
                fields: ["min", "max", "mid"],
              },
            },
            {
              calculate:
                "(datum.max - datum.min) === 0 ? 0 : (datum.value - datum.min) / (datum.max - datum.min)",
              as: "norm_val",
            },
          ],
          width: containerWidth / 3 + 70,
          height: 250,
          layer: [
            // Linhas principais
            {
              mark: "line",
              encoding: {
                x: {
                  field: "key",
                  type: "nominal",
                  axis: {
                    labelAngle: 0,
                    labelFontSize: 12,
                    title: null,
                  },
                },
                y: {
                  field: "norm_val",
                  type: "quantitative",
                  scale: { domain: [0, 1] },
                  axis: null,
                },
                color: {
                  field: "RecipeCategory",
                  type: "nominal",
                  legend: {
                    orient: "top",
                    direction: "horizontal",
                    title: "Category",
                    padding: 5,
                  },
                },

                detail: { field: "index" },
              },
            },

            // Pontos
            {
              mark: { type: "point", filled: true, size: 50 },
              encoding: {
                x: { field: "key", type: "nominal" },
                y: { field: "norm_val", type: "quantitative" },
                color: { field: "RecipeCategory", type: "nominal" },
                tooltip: [
                  { field: "Name", type: "nominal" },
                  { field: "key", type: "nominal", title: "Métrica" },
                  { field: "value", type: "quantitative", title: "Valor real" },
                  {
                    field: "DatePublished",
                    type: "temporal",
                    title: "Published",
                    format: "%d/%m/%Y",
                  },
                  { field: "image" },
                ],
              },
            },
            ...[0, 0.5, 1].map((pos) => ({
              encoding: {
                x: { type: "nominal", field: "key" },
                y: { value: 250 * pos },
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

    embed(chartRef.current, spec, {
      actions: false,
      renderer: "svg",
    }).then(() => setChartLoading(false));
  }, [
    data,
    selectedCategories,
    containerWidth,
    xFieldBarChart,
    topN,
    ascending,
    xFieldScatter,
    yFieldScatter,
  ]);

  useEffect(() => {
    if (!wordCloudRef.current || containerWidth === 0) return;

    const filtered = data
      .filter((d) => selectedCategories.includes(d.RecipeCategory))
      .filter((d) => d.RecipeIngredientParts);

    const allKeywords = filtered.flatMap((d) => {
      if (Array.isArray(d.RecipeIngredientParts)) {
        return d.RecipeIngredientParts.map((k) =>
          k.trim().replace(/^\[|\]$/g, "")
        );
      } else if (typeof d.RecipeIngredientParts === "string") {
        const parts = d.RecipeIngredientParts.includes(",")
          ? d.RecipeIngredientParts.split(",")
          : d.RecipeIngredientParts.split(" ");
        return parts.map((k) => k.trim().replace(/^\[|\]$/g, ""));
      }
      return [];
    });

    const words = d3
      .rollups(
        allKeywords,
        (v) => v.length,
        (w) => w
      )
      .sort((a, b) => d3.descending(a[1], b[1]))
      .slice(0, 100)
      .map(([text, size]) => ({ text, size }));

    wordCloudRef.current.innerHTML = "";

    const svg = d3
      .create("svg")
      .attr("viewBox", [0, 0, containerWidth, 300])
      .attr("width", containerWidth)
      .attr("height", 300)
      .attr("font-family", "sans-serif")
      .attr("text-anchor", "middle");

    const g = svg
      .append("g")
      .attr("transform", `translate(${containerWidth / 2},150)`);

    cloud()
      .size([containerWidth, 300])
      .words(words)
      .padding(2)
      .rotate(0)
      .font("sans-serif")
      .fontSize((d) => Math.sqrt(d.size) * 5)
      .on("end", (layoutWords) => {
        g.selectAll("text")
          .data(layoutWords)
          .enter()
          .append("text")
          .attr("font-size", (d) => d.size)
          .attr("fill", "#69b3a2")
          .attr(
            "transform",
            (d) => `translate(${d.x},${d.y}) rotate(${d.rotate})`
          )
          .text((d) => d.text);

        wordCloudRef.current.appendChild(svg.node());
      })
      .start();
  }, [data, selectedCategories, containerWidth]);

  return (
    <div ref={containerRef} className="w-full relative space-y-8">
      {chartLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
          <LoadingOverlay variant="neutral" />
        </div>
      )}
      <div
        ref={chartRef}
        className="w-full overflow-x-auto rounded-lg border border-gray-300"
        style={{ whiteSpace: "nowrap" }}
      />
      <div>
        {/* <h2 className="text-lg font-semibold mb-2">Top Ingredients</h2> */}
        <div ref={wordCloudRef} className="w-full" />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import * as vl from "vega-lite-api";
import embed from "vega-embed";

export default function LineChart({
  data,
  selectedCategories,
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const margin = { left: 20, right: 20 };
  const height = 550;

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

    // Determina categorias ativas
    const allCategories = [...new Set(data.map((d) => d.RecipeCategory))].sort();
    const activeCategories = selectedCategories.includes("All")
      ? allCategories
      : selectedCategories;

    const yearCategoryCounts = {};
    const yearTotalCounts = {};

    data.forEach((d) => {
      if (!d.DatePublished || !d.RecipeCategory) return;

      const year = d.DatePublished.slice(0, 4);
      const cat = d.RecipeCategory;

      if (!year.match(/^\d{4}$/) || !activeCategories.includes(cat)) return;

      const key = `${year}||${cat}`;
      yearCategoryCounts[key] = (yearCategoryCounts[key] || 0) + 1;

      yearTotalCounts[year] = (yearTotalCounts[year] || 0) + 1;
    });

    // Transforma em array de objetos por categoria
    const dataByCategory = Object.entries(yearCategoryCounts)
      .map(([key, count]) => {
        const [year, RecipeCategory] = key.split("||");
        return {
          year: +year,
          RecipeCategory,
          count,
        };
      });

    // Linha extra: total por ano de todas as categorias selecionadas
    const dataTotal = Object.entries(yearTotalCounts)
      .map(([year, count]) => ({
        year: +year,
        RecipeCategory: "TOTAL", // marcador especial
        count,
      }));

    // Junta os dados
    const finalData = [...dataByCategory, ...dataTotal].sort((a, b) => a.year - b.year);

    const spec = vl
      .markLine({ point: true })
      .data(finalData)
      .encode(
        vl.x().fieldN("year").title("Year"),
        vl.y().fieldQ("count").title("Number of Recipes"),
        vl.color().fieldN("RecipeCategory").title("Category"),
        vl.strokeDash().fieldN("RecipeCategory"), // linha pontilhada opcional
        vl.tooltip([
          { field: "year", title: "Year" },
          { field: "RecipeCategory", title: "Category" },
          { field: "count", title: "Recipes" },
        ])
      )
      .width(containerWidth)
      .height(height)
      .autosize({ type: "fit", contains: "padding" })
      .config({
        mark: {
          strokeDash: [
            [1, 0], // sólida para categorias
            [4, 4], // pontilhada para "TOTAL"
          ],
        },
      })
      .toSpec();

    embed(chartRef.current, spec, {
      actions: false,
      renderer: "svg",
      defaultStyle: true,
    });
  }, [data, selectedCategories, containerWidth]);

  return (
    <div ref={containerRef} className="w-full">
      <div ref={chartRef} className="w-full" />
    </div>
  );
}

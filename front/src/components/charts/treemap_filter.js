"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";



function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div 
        style={{ 
          width: 20, 
          height: 20, 
          backgroundColor: color, 
          borderRadius: 3,
          border: "1px solid #ccc",
        }} 
      />
      <span>{label}</span>
    </div>
  );
}



export default function TreemapFilter({
  data,
  selectedCategories,
  onCategoryToggle,
}) {



  const containerRef = useRef(null);

  useEffect(() => {
    const N = 30; // Número de categorias principais
    const categoryCounts = d3.rollup(
      data,
      (v) => v.length,
      (d) => d.RecipeCategory || "Unknown"
    );

    const sorted = Array.from(categoryCounts.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    const top = sorted.slice(0, N);
    const rest = sorted.slice(N);

    const otherCategoryNames = rest.map(([name]) => name);

    const categories = [
      ...top.map(([name, value]) => ({
        name,
        value,
        isSelected: selectedCategories.includes(name),
      })),
    ];

    const total = d3.sum(categories, (d) => d.value);


    // Adiciona a categoria "Others" como um nó simples
    if (rest.length > 0) {
      categories.push({
        name: "Others",
        value: rest.reduce((acc, [, val]) => acc + val, 0),
        isOthers: true,
        grouped: otherCategoryNames,
      });
    }

    // Clear
    d3.select(containerRef.current).selectAll("*").remove();

    const width = 1000;
    const height = 400;

    const root = d3
      .hierarchy({ children: categories })
      .sum((d) => d.value || 0);

    d3.treemap().size([width, height]).padding(2)(root);

    const svg = d3
      .select(containerRef.current)
      .append("svg")
      .attr("viewBox", [0, 0, width, height])
      .attr("width", "100%")
      .attr("height", height)
      .style("font-family", "sans-serif");

    const nodes = svg
      .selectAll("g")
      .data(root.leaves())
      .join("g")
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        if (d.data.isOthers && d.data.grouped) {
          // Envia todas agrupadas ao invés de apenas o nome "Others"
          onCategoryToggle(d.data.grouped);
        } else {
          onCategoryToggle([d.data.name]);
        }
      });

    nodes
      .append("rect")
      .attr("fill", (d) => {
        if (d.data.isOthers && d.data.grouped) {
          const someSelected = d.data.grouped.some((cat) =>
            selectedCategories.includes(cat)
          );
          return someSelected ? "#065f46" : "#10b981 ";
        }
        return selectedCategories.includes(d.data.name) ? "#065f46" : "#10b981 ";
      })
      .attr("stroke", "#fff")
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0);
    nodes
      .append("title")
      .text((d) => {
        const pct = ((d.value / total) * 100).toFixed(1);
        return `${d.data.name}: ${pct}%`;
      });  

    nodes
      .append("text")
      .attr("x", 4)
      .attr("y", 14)
      .attr("fill", "white")
      .attr("font-size", "12px")
      .text((d) =>
        d.data.name.length > 18 ? d.data.name.slice(0, 15) + "…" : d.data.name
      );

     

  }, [data, selectedCategories, onCategoryToggle]);

  return (
    <div className="w-full flex justify-center mb-4">
      
        
        <div ref={containerRef} />
      
    </div>
  );
}

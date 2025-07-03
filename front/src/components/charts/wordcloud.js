
"use client";


import * as d3 from "d3"
import cloud from 'd3-cloud'
import { useEffect, useRef, useState } from "react";
import * as vl from "vega-lite-api";
import embed from "vega-embed";


function WordCloud(text, {
  size = group => group.length, // Given a grouping of words, returns the size factor for that word
  word = d => d, // Given an item of the data array, returns the word
  marginTop = 0, // top margin, in pixels
  marginRight = 0, // right margin, in pixels
  marginBottom = 0, // bottom margin, in pixels
  marginLeft = 0, // left margin, in pixels
  width = 640, // outer width, in pixels
  height = 400, // outer height, in pixels
  maxWords = 250, // maximum number of words to extract from the text
  fontFamily = "sans-serif", // font family
  fontScale = 15, // base font size
  fill = null, // text color, can be a constant or a function of the word
  padding = 0, // amount of padding between the words (in pixels)
  rotate = 0, // a constant or function to rotate the words
  invalidation // when this promise resolves, stop the simulation
} = {}) {
  const words = typeof text === "string" ? text.split(/\W+/g) : Array.from(text);
  
  const data = d3.rollups(words, size, w => w)
    .sort(([, a], [, b]) => d3.descending(a, b))
    .slice(0, maxWords)
    .map(([key, size]) => ({text: word(key), size}));
  
  const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("font-family", fontFamily)
      .attr("text-anchor", "middle")
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

  const g = svg.append("g").attr("transform", `translate(${marginLeft},${marginTop})`);

  //d3Cloud = require("d3-cloud")

  const mycloud = cloud()
      .size([width - marginLeft - marginRight, height - marginTop - marginBottom])
      .words(data)
      .padding(padding)
      .rotate(rotate)
      .font(fontFamily)
      .fontSize(d => Math.sqrt(d.size) * fontScale)
      .on("word", ({size, x, y, rotate, text}) => {
        g.append("text")
            .datum(text)
            .attr("font-size", size)
            .attr("fill", fill)
            .attr("transform", `translate(${x},${y}) rotate(${rotate})`)
            .text(text);
      });

  mycloud.start();
  invalidation && invalidation.then(() => mycloud.stop());
  return svg.node();
}


export default function WordCloudChart({ data, selectedCategories }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const resize = () => {
      if (containerRef.current) {
        const width = containerRef.current.getBoundingClientRect().width - 40;
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

    // 1. Filtra as receitas pelas categorias selecionadas
    const selected = selectedCategories.includes("All")
      ? Array.from(new Set(data.map((d) => d.RecipeCategory))).sort()
      : selectedCategories;

    const filtered = data
      .filter((d) => selected.includes(d.RecipeCategory))
      .filter((d) => d.RecipeIngredientParts);

    // 2. Extrai e normaliza os keywords como strings únicas
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


    // 4. Gera a nuvem de palavras
    chartRef.current.innerHTML = ""; // limpa
    chartRef.current.appendChild(
      WordCloud(allKeywords, {
        width: containerWidth,
        height: 400,
        fontFamily: "sans-serif",
        fontSize: (d) => 10 + d.size * 2,
        padding: 2,
        fill: "#69b3a2",
      })
    );
  }, [data, selectedCategories, containerWidth]);

  return (
    <div ref={containerRef} className="w-full">
      <div ref={chartRef} className="w-full h-[400px]" />
    </div>
  );
}






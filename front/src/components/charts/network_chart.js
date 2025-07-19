"use client";

import * as d3 from "d3";
import cloud from "d3-cloud";
import { useEffect, useRef, useState } from "react";
import * as vl from "vega-lite-api";
import embed from "vega-embed";
import { LoadingOverlay } from "@/components/common/loading-overlay";

// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/disjoint-force-directed-graph
function ForceGraph({
  nodes, // an iterable of node objects (typically [{id}, …])
  links // an iterable of link objects (typically [{source, target}, …])
}, {
  nodeId = d => d.id, // given d in nodes, returns a unique identifier (string)
  nodeGroup, // given d in nodes, returns an (ordinal) value for color
  nodeGroups, // an array of ordinal values representing the node groups
  nodeTitle, // given d in nodes, a title string
  nodeFill = "currentColor", // node stroke fill (if not using a group color encoding)
  nodeStroke = "#fff", // node stroke color
  nodeStrokeWidth = 1.5, // node stroke width, in pixels
  nodeStrokeOpacity = 1, // node stroke opacity
  nodeRadius = 5, // node radius, in pixels
  nodeStrength,
  nodeDistanceMax,
  linkSource = ({source}) => source, // given d in links, returns a node identifier string
  linkTarget = ({target}) => target, // given d in links, returns a node identifier string
  linkStroke = "#999", // link stroke color
  linkStrokeOpacity = 0.6, // link stroke opacity
  linkStrokeWidth = 1.5, // given d in links, returns a stroke width in pixels
  linkStrokeLinecap = "round", // link stroke linecap
  linkStrength,
  colors = d3.schemeTableau10, // an array of color strings, for the node groups
  width = 640, // outer width, in pixels
  height = 400, // outer height, in pixels
  invalidation // when this promise resolves, stop the simulation
} = {}) {
  // Compute values.
  const N = d3.map(nodes, nodeId).map(intern);
  const LS = d3.map(links, linkSource).map(intern);
  const LT = d3.map(links, linkTarget).map(intern);
  if (nodeTitle === undefined) nodeTitle = (_, i) => N[i];
  const T = nodeTitle == null ? null : d3.map(nodes, nodeTitle);
  const R = typeof nodeRadius !== "function" ? null : d3.map(nodes, nodeRadius);
  const G = nodeGroup == null ? null : d3.map(nodes, nodeGroup).map(intern);
  const W = typeof linkStrokeWidth !== "function" ? null : d3.map(links, linkStrokeWidth);

  // Replace the input nodes and links with mutable objects for the simulation.
  nodes = d3.map(nodes, (_, i) => ({id: N[i]}));
  links = d3.map(links, (_, i) => ({source: LS[i], target: LT[i]}));

  // Compute default domains.
  if (G && nodeGroups === undefined) nodeGroups = d3.sort(G);

  // Construct the scales.
  const color = nodeGroup == null ? null : d3.scaleOrdinal(nodeGroups, colors);

  // Construct the forces.
  const forceNode = d3.forceManyBody();
  const forceLink = d3.forceLink(links).id(({index: i}) => N[i]);
  if (nodeStrength !== undefined) forceNode.strength(nodeStrength);
  if (nodeDistanceMax !== undefined) forceNode.distanceMax(nodeDistanceMax);
  if (linkStrength !== undefined) forceLink.strength(linkStrength);

  const simulation = d3.forceSimulation(nodes)
  .force("link", forceLink.distance(40))
  .force("charge", forceNode.strength(-100))
  .force("collide", d3.forceCollide(10))
  //.force("x", d3.forceX())
  //.force("y", d3.forceY()) // evita sobreposição
  //.force("center", d3.forceCenter(width / 2, height / 2)) // centraliza tudo
  
  .on("tick", ticked);


  const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

  const link = svg.append("g")
      .attr("stroke", linkStroke)
      .attr("stroke-opacity", linkStrokeOpacity)
      .attr("stroke-width", typeof linkStrokeWidth !== "function" ? linkStrokeWidth : null)
      .attr("stroke-linecap", linkStrokeLinecap)
    .selectAll("line")
    .data(links)
    .join("line");

  if (W) link.attr("stroke-width", ({index: i}) => W[i]);

  const node = svg.append("g")
      .attr("fill", nodeFill)
      .attr("stroke", nodeStroke)
      .attr("stroke-opacity", nodeStrokeOpacity)
      .attr("stroke-width", nodeStrokeWidth)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
      .attr("r", nodeRadius)
      .call(drag(simulation));

  if (G) node.attr("fill", ({index: i}) => color(G[i]));
  if (T) node.append("title").text(({index: i}) => T[i]);
  if (R) node.attr("r", ({index: i}) => R[i])

  // Handle invalidation.
  if (invalidation != null) invalidation.then(() => simulation.stop());

  function intern(value) {
    return value !== null && typeof value === "object" ? value.valueOf() : value;
  }

  function ticked() {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
  }

  function drag(simulation) {    
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    
    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    
    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    
    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  return Object.assign(svg.node(), {scales: {color}});
}

export default function NetworkChart({ data, selectedCategories }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [chartLoading, setChartLoading] = useState(true);

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
  setChartLoading(true);

  // 1. Filtra os dados conforme categorias selecionadas e ingredientes válidos
  const filtered = data
    .filter(d => selectedCategories.includes(d.RecipeCategory))
    .filter(d => d.RecipeIngredientParts);

  // 2. Contagem por categoria
  const categoryCounts = d3.rollup(
    filtered,
    v => v.length,
    d => d.RecipeCategory
  );
  const topCategories = Array.from(categoryCounts.entries())
    .sort((a, b) => d3.descending(a[1], b[1]))
    .slice(0, 10)
    .map(d => d[0]);

  // 3. Contagem de ingredientes
  const ingredientCounts = new Map();
  const ingredientCountsByCategory = new Map();

  filtered.forEach(d => {
    const cat = d.RecipeCategory;
    if (!topCategories.includes(cat)) return;

    let parts = [];

    if (Array.isArray(d.RecipeIngredientParts)) {
      parts = d.RecipeIngredientParts;
    } else if (typeof d.RecipeIngredientParts === "string") {
      parts = d.RecipeIngredientParts.includes(",")
        ? d.RecipeIngredientParts.split(",")
        : d.RecipeIngredientParts.split(" ");
    }

    const cleanParts = parts.map(k =>
      k.trim().replace(/^\[|\]$/g, "")
    );

    cleanParts.forEach(ing => {
      ingredientCounts.set(ing, (ingredientCounts.get(ing) || 0) + 1);

      if (!ingredientCountsByCategory.has(cat)) {
        ingredientCountsByCategory.set(cat, new Map());
      }
      const catMap = ingredientCountsByCategory.get(cat);
      catMap.set(ing, (catMap.get(ing) || 0) + 1);
    });
  });

  // 4. Top 20 ingredientes dentro do filtrado
  const topIngredients = Array.from(ingredientCounts.entries())
    .sort((a, b) => d3.descending(a[1], b[1]))
    .slice(0, 20)
    .map(d => d[0]);

  // 5. Construção dos nós e links
  const nodes = [
    ...topCategories.map(c => ({ id: c, group: "category" })),
    ...topIngredients.map(i => ({ id: i, group: "ingredient" })),
  ];

  const links = [];
  topCategories.forEach(cat => {
    const ingMap = ingredientCountsByCategory.get(cat) || new Map();
    topIngredients.forEach(ing => {
      const count = ingMap.get(ing);
      if (count) {
        links.push({ source: cat, target: ing, value: count });
      }
    });
  });

  // 6. Renderiza o grafo
  chartRef.current.innerHTML = "";
  chartRef.current.appendChild(
  ForceGraph(
    { nodes, links },
    {
      width: containerWidth,
      height: 500,
      nodeGroup: d => d.group,
    //nodeGroups: Array.from(new Set(nodes.map(d => d.group))), 
    colors: d3.schemeTableau10, // <- únicas categorias
      nodeTitle: d => d.id,
      linkStrokeWidth: d => Math.sqrt(d.value),
      nodeRadius: 8,
      linkStrength: d => 0.01, // mais fraco, espalha mais
      forces: [
        d3.forceManyBody().strength(-500), // mais repulsão
        d3.forceCenter(containerWidth / 2, 250), // centro
        d3.forceCollide(0.01), // evita sobreposição
      ],
    }
  )
);

  setChartLoading(false);
}, [data, selectedCategories, containerWidth]);


  return (
    <div
      ref={containerRef}
      className="w-full relative"
      style={{ height: "400px" }}
    >
      {chartLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
          <LoadingOverlay variant="neutral" />
        </div>
      )}
      <div ref={chartRef} className="w-full h-full" />
    </div>
  );
}

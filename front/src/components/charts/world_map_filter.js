"use client";

import { useEffect, useRef, useState } from "react";
import embed from "vega-embed";
import { countryIdToName } from "@/utils/iso_to_country";

export default function WorldMapFilter({
  countriesWithRecipes,
  selectedCountryIds,
  onCountryToggle,
  selectedCategories,
  filterMode,
  setSelectedCountryIds,
}) {
  const ref = useRef(null);
  const [containerWidth, setContainerWidth] = useState(700);

  // Observa mudanças no tamanho do container do gráfico
  useEffect(() => {
    if (!ref.current) return;

    const ro = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const w = entry.contentRect.width;
        setContainerWidth(w - 300);
      }
    });

    ro.observe(ref.current.parentElement); // observa o container pai, que controla a largura

    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!containerWidth) return;

    const values = countriesWithRecipes.map((id) => ({
      id,
      hasRecipe: true,
    }));

    const nameLookup = Object.entries(countryIdToName).map(([id, name]) => ({
      id: +id,
      name,
    }));

    const width = containerWidth;
    const height = 400;

    const spec = {
      width,
      height,
      data: {
        url: "https://vega.github.io/vega-datasets/data/world-110m.json",
        format: { type: "topojson", feature: "countries" },
      },
      transform: [
        {
          lookup: "id",
          from: {
            data: { name: "countriesWithRecipes", values },
            key: "id",
            fields: ["hasRecipe"],
          },
        },
        {
          lookup: "id",
          from: {
            data: { name: "countryNames", values: nameLookup },
            key: "id",
            fields: ["name"],
          },
        },
        {
          calculate: `indexof([${selectedCountryIds.join(
            ","
          )}], datum.id) >= 0`,
          as: "isSelected",
        },
        {
          calculate: `
      datum.hasRecipe 
        ? (datum.isSelected ? "Selected with recipe" : "Has recipe") 
        : "Don't have recipe"
    `,
          as: "recipeStatus",
        },
      ],
      projection: { type: "equirectangular" },
      selection: {
        selectedCountry: {
          type: "multi",
          on: "click",
          fields: ["id"],
          toggle: true,
          empty: "none",
        },
      },
      mark: "geoshape",
      encoding: {
        color: {
          field: "recipeStatus",
          type: "nominal",
          scale: {
            domain: ["Selected with recipe", "Has recipe", "Don't have recipe"],
            range: ["#065f46", "#10b981", "#e5e7eb"],
          },
          legend: {
            title: "Status",
            orient: "left",
            labelFontSize: 16,
            titleFontSize: 18,
          },
        },
        tooltip: { field: "name", type: "nominal" },
        stroke: {
          condition: {
            selection: "selectedCountry",
            value: "black",
          },
          value: null,
        },
        strokeWidth: {
          condition: {
            selection: "selectedCountry",
            value: 2,
          },
          value: 0.5,
        },
      },
    };

    // Limpa antes de renderizar (para evitar sobreposição)
    ref.current.innerHTML = "";

    embed(ref.current, spec, { actions: false, renderer: "svg" }).then(
      (result) => {
        result.view.addSignalListener("selectedCountry", (name, value) => {
          let clickedId = null;

          if (Array.isArray(value) && value.length > 0) {
            clickedId = value[value.length - 1].id;
          } else if (value && typeof value === "object" && "id" in value) {
            clickedId = value.id;
          }

          if (
            clickedId != null &&
            countriesWithRecipes.includes(Number(clickedId))
          ) {
            const nameResolved = countryIdToName[Number(clickedId)];
            if (nameResolved) onCountryToggle(Number(clickedId), nameResolved);
          }
        });
      }
    );
  }, [
    countriesWithRecipes,
    selectedCountryIds,
    onCountryToggle,
    containerWidth,
  ]);

  useEffect(() => {
    if (filterMode !== "multiselect") return;

    const idToCategory = Object.fromEntries(
      Object.entries(categoryToCountryMap).map(([cat, name]) => [
        cat,
        countryNameToId[name],
      ])
    );

    const newCountryIds = selectedCategories
      .map((c) => idToCategory[c.name])
      .filter((id) => typeof id === "number");

    setSelectedCountryIds(newCountryIds);
  }, [selectedCategories, filterMode]);

  return (
    <div className="w-full flex justify-center mb-4 px-4">
      <div className="bg-white rounded-xl shadow-md p-4 w-full">
        <div ref={ref} className="w-full h-full" />
      </div>
    </div>
  );
}

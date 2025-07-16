"use client";

import { useEffect, useRef } from "react";
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

  useEffect(() => {
    const values = countriesWithRecipes.map((id) => ({
      id,
      hasRecipe: true,
    }));

    const nameLookup = Object.entries(countryIdToName).map(([id, name]) => ({
      id: +id,
      name,
    }));

    const spec = {
      width: 1400,
      height: 400,
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

          condition: [
            {
              test: "datum.hasRecipe && datum.isSelected",
              value: "#065f46",
            },
          ],

          field: "hasRecipe",
          type: "nominal",
          scale: { domain: [true, null], range: ["#10b981", "#e5e7eb"] },
          legend: {title: "Has recipes?",
                  orient: "left",      // ou "right", "left", etc.
                  labelFontSize: 16,     // aumenta o tamanho da fonte das labels
                  titleFontSize: 18,     // aumenta o tamanho da fonte do título
                  //symbolSize: 20,       // aumenta o tamanho dos quadrados coloridos
                  //padding: 10,
                  //offset: 10,
                  // 
                  },
        },
        tooltip: { field: "name", type: "nominal" },
        stroke: {
          condition: { 
            selection: "selectedCountry",
             value: "black" },
          value: null, // nenhum contorno quando não selecionado
        },
        strokeWidth: {
          condition: { 
            selection: "selectedCountry",
             value: 2 },
          value: 0.5, // borda fina padrão
        },

      },
      };

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
  }, [countriesWithRecipes, selectedCountryIds, onCountryToggle]);

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
    <div className="w-full flex justify-center mb-4">
      
        {/* Legenda à esquerda */}
        

        {/* Mapa mais próximo e centrado */}
        <div className="pl-4 pr-2 py-2 flex-1 h-full" ref={ref} />
      
    </div>
  );
}

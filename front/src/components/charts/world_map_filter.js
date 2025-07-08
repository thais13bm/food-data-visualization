"use client";

import { useEffect, useRef } from "react";
import embed from "vega-embed";
import { countryIdToName } from "@/utils/iso_to_country";

export default function WorldMapFilter({
  countriesWithRecipes,
  selectedCountryIds,
  onCountryToggle, 
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
              value: "#ef4444",
            },
          ],
          field: "hasRecipe",
          type: "nominal",
          scale: { domain: [true, null], range: ["#10b981", "#e5e7eb"] },
          legend: null,
        },
        tooltip: { field: "name", type: "nominal" },
        stroke: {
          condition: { selection: "selectedCountry", value: "black" },
          value: null,
        },
        strokeWidth: {
          condition: { selection: "selectedCountry", value: 2 },
          value: 0.5,
        },
      },
      config: { view: { stroke: null } },
    };

    embed(ref.current, spec, { actions: false, renderer: "svg" }).then(
      (result) => {
        result.view.addSignalListener("selectedCountry", (name, value) => {
          let clickedId = null;

          if (Array.isArray(value) && value.length > 0) {
            clickedId = value[value.length - 1].id; // pega o último clicado
          } else if (value && typeof value === "object" && "id" in value) {
            clickedId = value.id;
          }

          if (clickedId != null) {
            const nameResolved = countryIdToName[Number(clickedId)];
            if (nameResolved) onCountryToggle(Number(clickedId), nameResolved);
          }
        });
      }
    );
  }, [countriesWithRecipes, selectedCountryIds, onCountryToggle]);

  return (
    <div className="w-full flex justify-center">
      <div ref={ref} className="max-w-full" />
    </div>
  );
}

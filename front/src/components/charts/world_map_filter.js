"use client";

import { useEffect, useRef } from "react";
import embed from "vega-embed";
import { countryIdToName } from "@/utils/iso_to_country";

export default function WorldMapFilter({
  countriesWithRecipes,
  onCountrySelect,
}) {
  const ref = useRef(null);

  useEffect(() => {
    console.log("Rendering world map with countries:", countriesWithRecipes);
    console.log("Country ID to Name mapping:", countryIdToName);
    // Vega-Lite data para lookup
    const values = countriesWithRecipes.map((id) => ({
      id,
      hasRecipe: true,
    }));

    // Dicionário auxiliar com nomes para tooltip
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
            data: {
              name: "countriesWithRecipes",
              values: values,
            },
            key: "id",
            fields: ["hasRecipe"],
          },
        },
        {
          lookup: "id",
          from: {
            data: {
              name: "countryNames",
              values: nameLookup,
            },
            key: "id",
            fields: ["name"],
          },
        },
      ],
      projection: { type: "equirectangular" },
      selection: {
        selectedCountry: {
          type: "single",
          on: "click",
          fields: ["id"],
          empty: "none",
        },
      },
      mark: "geoshape",
      encoding: {
        color: {
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
          console.log("Signal name:", name); // Deve ser "selectedCountry"
          console.log("Signal value:", value); // Aqui sim vem o valor do país selecionado

          let countryId = null;

          if (Array.isArray(value) && value.length > 0) {
            countryId = value[0].id;
          } else if (value && typeof value === "object" && "id" in value) {
            countryId = value.id;
          } else {
            console.warn("Unexpected signal value format:", value);
          }

          const nameResolved = countryIdToName[Number(countryId)];
          console.log("Selected ID:", countryId, "Name:", nameResolved);

          if (nameResolved) onCountrySelect(nameResolved);
        });
      }
    );
  }, [countriesWithRecipes, onCountrySelect]);

  return (
    <div className="w-full flex justify-center">
      <div ref={ref} className="max-w-full" />
    </div>
  );
}

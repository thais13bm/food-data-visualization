"use client";

import { useEffect, useRef } from "react";
import embed from "vega-embed";

export default function WorldMapFilter({
  countriesWithRecipes,
  onCountrySelect,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const values = countriesWithRecipes.map((country) => ({
      country,
      hasRecipe: true,
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
          lookup: "properties.name",
          from: {
            data: { name: "countriesWithRecipes", values },
            key: "country",
            fields: ["hasRecipe"],
          },
        },
      ],
      projection: { type: "equirectangular" },
      selection: {
        selectedCountry: {
          type: "single",
          on: "click",
          fields: ["properties.name"],
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
        tooltip: { field: "properties.name", type: "nominal" },
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
        result.view.addSignalListener("selectedCountry", (countryName) => {
          if (countryName) {
            onCountrySelect(countryName);
          }
        });
      }
    );
  }, [countriesWithRecipes, onCountrySelect]);

  return <div ref={ref} className="w-full flex justify-center items-center" />;
}

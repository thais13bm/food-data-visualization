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
    <div className="w-full flex justify-center mb-4">
      <div className="flex border rounded max-w-full overflow-hidden h-[400px]">
        {/* Legenda à esquerda */}
        <div className="w-48 h-full overflow-y-auto border-r p-2 text-sm text-muted-foreground">
          <div className="font-semibold mb-2">Selected countries</div>
          {selectedCountryIds.length === 0 ? (
            <div className="text-gray-400 italic">None</div>
          ) : (
            <ul className="space-y-1">
              {selectedCountryIds.map((id) => (
                <li key={id} className="truncate">
                  {countryIdToName[id] ?? `#${id}`}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Mapa mais próximo e centrado */}
        <div className="pl-4 pr-2 py-2 flex-1 h-full" ref={ref} />
      </div>
    </div>
  );
}

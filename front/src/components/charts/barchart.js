"use client";

import { useEffect, useRef } from "react";
import * as vl from "vega-lite-api";
import embed from "vega-embed";

export default function BarChart({ data, selectedCategories, topN, xField }) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const unitsMap = {
      Calories: "kcal",
      FatContent: "g",
      SugarContent: "g",
      SodiumContent: "mg",
      ProteinContent: "g",
      CholesterolContent: "mg",
      CarbohydrateContent: "g",
      FiberContent: "g",
      // adicione outros campos conforme necessário
    };


    function renameFieldWithUnit(data, xField, unitsMap) {
      const unit = unitsMap[xField];
      const newFieldName = unit ? `${xField} (${unit})` : xField;

      const newData = data.map((item) => ({
        ...item,
        [newFieldName]: item[xField],
      }));

      return { data: newData, fieldName: newFieldName };
    }



    const allCategories = [
      ...new Set(data.map((d) => d.RecipeCategory)),
    ].sort();

    const activeCategories = selectedCategories.includes("All")
      ? allCategories
      : selectedCategories;

    const filtered = data
      .filter((d) => d[xField] && !isNaN(d[xField]))
      .filter((d) => activeCategories.includes(d.RecipeCategory));

    const top = [...filtered]
      .sort((a, b) => b[xField] - a[xField])
      .slice(0, topN);

    //const {renamedData, xField } = renameFieldWithUnit(top, xField, unitsMap);

    const { data: preparedData, fieldName: xFieldLabel } = renameFieldWithUnit(top, xField, unitsMap);


    const spec = vl
      .markBar()
      .data(preparedData)
      .encode(
        vl.x().fieldQ(xFieldLabel).title(xFieldLabel),
        vl.y().fieldN("Name").sort("-x").title("Recipe"),
        vl.color().fieldN("RecipeCategory").title("Category"),
        vl.tooltip([
          { field: "AuthorName", title: "Author" },
          { field: "Description", title: "Description" },
          { field: xFieldLabel, title: xFieldLabel },
          { field: "RecipeId", title: "RecipeId" },
        ])
      )
      .width(600)
      .height(40 * top.length)
      .toSpec();

    embed(chartRef.current, spec, { actions: false });
  }, [data, selectedCategories, topN, xField]);

  return <div ref={chartRef} />;
}

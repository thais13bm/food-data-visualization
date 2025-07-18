"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Multiselect } from "@/components/ui/multiselect";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { LoadingOverlay } from "@/components/common/loading-overlay";
import { categoryToCountryMap } from "@/utils/category_to_country_map";
import { countryNameToId } from "@/utils/country_to_iso";

const BarChart = dynamic(() => import("@/components/charts/barchart"), {
  ssr: false,
});
const ScatterPlot = dynamic(() => import("@/components/charts/scatterplot"), {
  ssr: false,
});
const WordCloudChart = dynamic(() => import("@/components/charts/wordcloud"), {
  ssr: false,
});

const ParallelCoordinatesChart = dynamic(
  () => import("@/components/charts/parallel_coord_plot"),
  {
    ssr: false,
  }
);

const WorldMapFilter = dynamic(
  () => import("@/components/charts/world_map_filter"),
  {
    ssr: false,
  }
);

const TreemapFilter = dynamic(
  () => import("@/components/charts/treemap_filter"),
  {
    ssr: false,
  }
);

interface Recipe {
  RecipeCategory: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function RecipesPage() {
  const {
    data = [],
    error,
    isLoading,
  } = useSWR<Recipe[]>("/api/recipes", fetcher);

  const [selectedCategories, setSelectedCategories] = useState([
    { name: "Potato" },
    { name: "Chicken" },
  ]);
  const [open, setOpen] = useState(false);

  const [topN, setTopN] = useState(2);
  const [xFieldBarChart, setXFieldBarChart] = useState("Calories (kcal)");
  const [xFieldScatterPlot, setXFieldScatterPlot] = useState("Calories (kcal)");
  const [yField, setYField] = useState("FatContent (g)");
  const [ascending, setAscending] = useState(false);
  const [filterMode, setFilterMode] = useState("treemap");
  const [selectedCountryIds, setSelectedCountryIds] = useState<number[]>([]);
  const [brushedData, setBrushedData] = useState([]);

  const countriesWithRecipes = Array.from(
    new Set(
      data
        .map((d) => d.RecipeCategory)
        .filter((cat) => categoryToCountryMap[cat])
        .map((cat) => categoryToCountryMap[cat])
        .filter((country) => countryNameToId[country])
        .map((country) => countryNameToId[country])
    )
  );

  const rawCategories = Array.from(
    new Set(data.map((d: any) => d.RecipeCategory).filter(Boolean))
  ).map((name) => ({ name }));

  const allCategories = [{ name: "All" }, ...rawCategories];

  const handleSelect = (item: { name: string }) => {
    if (item.name === "All") {
      setSelectedCategories([{ name: "All" }]);
      return;
    }

    let newSelected = selectedCategories.filter((c) => c.name !== "All");

    if (selectedCategories.find((c) => c.name === item.name)) {
      newSelected = newSelected.filter((c) => c.name !== item.name);
    } else {
      newSelected.push(item);
    }

    if (newSelected.length === rawCategories.length) {
      setSelectedCategories([{ name: "All" }]);
    } else {
      setSelectedCategories(newSelected);
    }
  };

  const handleRemove = (item: { name: string }) => {
    if (item.name === "All") {
      setSelectedCategories([]);
      return;
    }

    setSelectedCategories(
      selectedCategories.filter((c) => c.name !== item.name && c.name !== "All")
    );
  };

  useEffect(() => {
    if (filterMode !== "map") return;

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
  }, [filterMode, selectedCategories]);

  useEffect(() => {
    if (filterMode === "treemap") {
      setSelectedCategories([{ name: "Potato" }, { name: "Chicken" }]);
    }
  }, [filterMode]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <LoadingOverlay variant="muted" />
      </div>
    );
  }

  if (error) return <p>Error loading data</p>;
  return (
    <>
      <div className="px-4 md:px-8 pb-6 min-h-screen">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Now analyze general trends!
          </h1>
          <p className="text-muted-foreground text-base mt-1">
            Recipes aggregated per category, and other insights!
          </p>
        </div>
        <div className="mb-4 w-full max-w-[300px]">
          <label className="text-base font-semibold block mb-1">
            Filter mode
          </label>
          <Select value={filterMode} onValueChange={setFilterMode}>
            <SelectTrigger className="w-full h-9 text-sm">
              <SelectValue placeholder="Select filter mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="multiselect">Multiselect</SelectItem>
              <SelectItem value="map">World Map</SelectItem>
              <SelectItem value="treemap">Tree Map</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filterMode === "multiselect" && (
          <div className="inline-block min-w-[300px] max-w-[600px] mb-4">
            <Multiselect
              data={allCategories}
              open={open}
              onOpenChange={setOpen}
              modal={false}
              optionKey="name"
              optionValue="name"
              optionLabel="name"
              selectedOptions={selectedCategories}
              onSelect={handleSelect}
              onRemove={handleRemove}
              buttonPlaceholder="Select categories"
              filterPlaceholder="Filter categories..."
            />
          </div>
        )}

        {filterMode === "map" && (
          <WorldMapFilter
            countriesWithRecipes={countriesWithRecipes}
            selectedCountryIds={selectedCountryIds}
            onCountryToggle={(countryId) => {
              setSelectedCountryIds((prevIds) => {
                const alreadySelected = prevIds.includes(countryId);
                const newIds = alreadySelected
                  ? prevIds.filter((id) => id !== countryId)
                  : [...prevIds, countryId];

                const idToCategory = Object.fromEntries(
                  Object.entries(categoryToCountryMap).map(([cat, name]) => [
                    countryNameToId[name],
                    cat,
                  ])
                );

                const categories = newIds
                  .map((id) => idToCategory[id])
                  .filter(Boolean)
                  .map((name) => ({ name }));

                setSelectedCategories(categories.length > 0 ? categories : []);
                return newIds;
              });
            }}
            selectedCategories={selectedCategories}
            filterMode={filterMode}
            setSelectedCountryIds={setSelectedCountryIds}
          />
        )}

        {filterMode === "treemap" && (
          <TreemapFilter
            data={data}
            selectedCategories={selectedCategories.map((c) => c.name)}
            onCategoryToggle={(clickedNames) => {
              const namesArray = Array.isArray(clickedNames)
                ? clickedNames
                : [clickedNames];

              let newSelected = selectedCategories.filter(
                (c) => c.name !== "All"
              );

              const allAreSelected = namesArray.every((name) =>
                selectedCategories.some((c) => c.name === name)
              );

              if (allAreSelected) {
                // Remove todos
                newSelected = newSelected.filter(
                  (c) => !namesArray.includes(c.name)
                );
              } else {
                // Adiciona os que faltam
                namesArray.forEach((name) => {
                  if (!newSelected.some((c) => c.name === name)) {
                    newSelected.push({ name });
                  }
                });
              }

              if (newSelected.length === rawCategories.length) {
                setSelectedCategories([{ name: "All" }]);
              } else if (newSelected.length === 0) {
                setSelectedCategories([]);
              } else {
                setSelectedCategories(newSelected);
              }
            }}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bar Chart */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle>BarChart</CardTitle>
            </CardHeader>
            <div className="pl-4 pb-4 flex flex-wrap items-center gap-6">
              {/* Campo X Field */}
              <div className="w-full max-w-[200px]">
                <label className="text-base font-semibold">X Field</label>
                <Select
                  value={xFieldBarChart}
                  onValueChange={setXFieldBarChart}
                >
                  <SelectTrigger className="w-full h-9 text-sm">
                    <SelectValue placeholder="Choose the field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AggregatedRating">
                      Aggregated Rating
                    </SelectItem>
                    <SelectItem value="ReviewCount">Review Count</SelectItem>
                    <SelectItem value="Calories (kcal)">
                      Calories (kcal)
                    </SelectItem>
                    <SelectItem value="FatContent (g)">Fat Content</SelectItem>
                    <SelectItem value="SaturatedFatContent (g)">
                      Saturated Fat Content
                    </SelectItem>
                    <SelectItem value="CholesterolContent (mg)">
                      Cholesterol Content
                    </SelectItem>
                    <SelectItem value="SodiumContent (mg)">
                      Sodium Content
                    </SelectItem>
                    <SelectItem value="CarbohydrateContent (g)">
                      Carbohydrate Content
                    </SelectItem>
                    <SelectItem value="FiberContent (g)">
                      Fiber Content
                    </SelectItem>
                    <SelectItem value="SugarContent (g)">
                      Sugar Content
                    </SelectItem>
                    <SelectItem value="ProteinContent (g)">
                      Protein Content
                    </SelectItem>
                    <SelectItem value="RecipeServings">
                      Recipe Servings
                    </SelectItem>
                    <SelectItem value="NumIngredients">
                      Number of Ingredients
                    </SelectItem>
                    <SelectItem value="CookTime_hours">
                      Cook Time (hours)
                    </SelectItem>
                    <SelectItem value="PrepTime_hours">
                      Prep Time (hours)
                    </SelectItem>
                    <SelectItem value="TotalTime_hours">
                      Total Time (hours)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Campo Quantity */}
              <div className="w-full max-w-[200px]">
                <label htmlFor="topN" className="text-base font-semibold">
                  Quantity
                </label>
                <input
                  id="topN"
                  type="number"
                  min={1}
                  max={50}
                  value={topN}
                  onChange={(e) => setTopN(Number(e.target.value))}
                  className="border rounded p-2 w-full h-9 text-center"
                />
              </div>

              <div className="w-full max-w-[200px] pt-6">
                {/* <label className="text-base font-semibold">Order</label> */}
                <button
                  onClick={() => setAscending((prev) => !prev)}
                  className="w-9 h-9 border rounded flex items-center justify-center transition-colors hover:bg-muted"
                  title={
                    ascending
                      ? "Sort ascending (smallest on top)"
                      : "Sort descending (largest on top)"
                  }
                >
                  {ascending ? (
                    <ArrowDownIcon className="w-5 h-5" />
                  ) : (
                    <ArrowUpIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <CardContent className="w-full min-w-0 min-h-[300px] relative overflow-hidden">
              <BarChart
                data={data}
                selectedCategories={selectedCategories.map((c) => c.name)}
                topN={topN}
                xField={xFieldBarChart}
                ascending={ascending}
              />
            </CardContent>
          </Card>

          {/* Word Cloud */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Word Cloud (Ingredients)</CardTitle>
            </CardHeader>
            <CardContent className="w-full min-w-0 overflow-hidden">
              <WordCloudChart
                data={data}
                selectedCategories={selectedCategories.map((c) => c.name)}
              />
            </CardContent>
          </Card>

          {/* Scatter Plot */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle>ScatterPlot</CardTitle>
            </CardHeader>
            <div className="pl-4 pb-4 flex flex-wrap items-center gap-6">
              {/* Campo X Field */}
              <div className="w-full max-w-[200px]">
                <label className="text-base font-semibold">X Field</label>
                <Select
                  value={xFieldScatterPlot}
                  onValueChange={setXFieldScatterPlot}
                >
                  <SelectTrigger className="w-full h-9 text-sm">
                    <SelectValue placeholder="Choose the field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AggregatedRating">
                      Aggregated Rating
                    </SelectItem>
                    <SelectItem value="ReviewCount">Review Count</SelectItem>
                    <SelectItem value="Calories (kcal)">
                      Calories (kcal)
                    </SelectItem>
                    <SelectItem value="FatContent (g)">Fat Content</SelectItem>
                    <SelectItem value="SaturatedFatContent (g)">
                      Saturated Fat Content
                    </SelectItem>
                    <SelectItem value="CholesterolContent (mg)">
                      Cholesterol Content
                    </SelectItem>
                    <SelectItem value="SodiumContent (mg)">
                      Sodium Content
                    </SelectItem>
                    <SelectItem value="CarbohydrateContent (g)">
                      Carbohydrate Content
                    </SelectItem>
                    <SelectItem value="FiberContent (g)">
                      Fiber Content
                    </SelectItem>
                    <SelectItem value="SugarContent (g)">
                      Sugar Content
                    </SelectItem>
                    <SelectItem value="ProteinContent (g)">
                      Protein Content
                    </SelectItem>
                    <SelectItem value="RecipeServings">
                      Recipe Servings
                    </SelectItem>
                    <SelectItem value="NumIngredients">
                      Number of Ingredients
                    </SelectItem>
                    <SelectItem value="CookTime_hours">
                      Cook Time (hours)
                    </SelectItem>
                    <SelectItem value="PrepTime_hours">
                      Prep Time (hours)
                    </SelectItem>
                    <SelectItem value="TotalTime_hours">
                      Total Time (hours)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Campo Y Field */}
              <div className="w-full max-w-[200px]">
                <label className="text-base font-semibold">Y Field</label>
                <Select value={yField} onValueChange={setYField}>
                  <SelectTrigger className="w-full h-9 text-sm">
                    <SelectValue placeholder="Choose the field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AggregatedRating">
                      Aggregated Rating
                    </SelectItem>
                    <SelectItem value="ReviewCount">Review Count</SelectItem>
                    <SelectItem value="Calories (kcal)">
                      Calories (kcal)
                    </SelectItem>
                    <SelectItem value="FatContent (g)">Fat Content</SelectItem>
                    <SelectItem value="SaturatedFatContent (g)">
                      Saturated Fat Content
                    </SelectItem>
                    <SelectItem value="CholesterolContent (mg)">
                      Cholesterol Content
                    </SelectItem>
                    <SelectItem value="SodiumContent (mg)">
                      Sodium Content
                    </SelectItem>
                    <SelectItem value="CarbohydrateContent (g)">
                      Carbohydrate Content
                    </SelectItem>
                    <SelectItem value="FiberContent (g)">
                      Fiber Content
                    </SelectItem>
                    <SelectItem value="SugarContent (g)">
                      Sugar Content
                    </SelectItem>
                    <SelectItem value="ProteinContent (g)">
                      Protein Content
                    </SelectItem>
                    <SelectItem value="RecipeServings">
                      Recipe Servings
                    </SelectItem>
                    <SelectItem value="NumIngredients">
                      Number of Ingredients
                    </SelectItem>
                    <SelectItem value="CookTime_hours">
                      Cook Time (hours)
                    </SelectItem>
                    <SelectItem value="PrepTime_hours">
                      Prep Time (hours)
                    </SelectItem>
                    <SelectItem value="TotalTime_hours">
                      Total Time (hours)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <CardContent className="w-full min-w-0 overflow-hidden">
              <ScatterPlot
                data={data}
                selectedCategories={selectedCategories.map((c) => c.name)}
                xField={xFieldScatterPlot}
                yField={yField}
                onBrushChange={(brushed) => setBrushedData(brushed)}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Parallel coordinates : avg nutrients</CardTitle>
            </CardHeader>
            <CardContent>
              <ParallelCoordinatesChart
                data={data}
                selectedCategories={selectedCategories.map((c) => c.name)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

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

const LineChart = dynamic(() => import("@/components/charts/linechart"), {
  ssr: false,
});

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
      <div className="px-4 md:px-8 min-h-screen mb-4">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            You can see the amount of recipes over time...
          </h1>
          <p className="text-muted-foreground text-base mt-1">
            OBS: This is a sampled version of the original dataset
          </p>
        </div>
        <div className="flex justify-center p-4">
          <div className="w-full flex flex-col gap-4">
            <div className="flex-1 ">
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
                    onClearAll={() => setSelectedCategories([])}
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
                        Object.entries(categoryToCountryMap).map(
                          ([cat, name]) => [countryNameToId[name], cat]
                        )
                      );

                      const categories = newIds
                        .map((id) => idToCategory[id])
                        .filter(Boolean)
                        .map((name) => ({ name }));

                      setSelectedCategories(
                        categories.length > 0 ? categories : []
                      );
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

              <div className="w-full overflow-x-auto pb-6">
                <div className="flex flex-row gap-4 min-w-[1200px] px-2 justify-center">
                  {/* Bar Chart */}
                  <div className="w-full max-w-[1200px]">
                    <Card>
                      <CardHeader className="text-center">
                        <CardTitle>Linechart</CardTitle>
                      </CardHeader>

                      <CardContent className="w-full flex justify-center">
                        <div className="w-full max-w-full">
                          <LineChart
                            data={data}
                            selectedCategories={selectedCategories.map((c) => c.name)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

            </div>
            
          </div>
        </div>
      </div>
    </>
  );
}

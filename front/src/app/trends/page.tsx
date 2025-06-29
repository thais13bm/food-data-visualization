"use client";

import { useState } from "react";
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

const BarChart = dynamic(() => import("@/components/charts/barchart"), {
  ssr: false,
});
const ScatterPlot = dynamic(() => import("@/components/charts/scatterplot"), {
  ssr: false,
});

interface Recipe {
  RecipeCategory: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TrendsPage() {
  const {
    data = [],
    error,
    isLoading,
  } = useSWR<Recipe[]>("/api/recipes", fetcher);

  const [selectedCategories, setSelectedCategories] = useState([
    { name: "All" },
  ]);
  const [open, setOpen] = useState(false);

  const [topN, setTopN] = useState(10);
  const [xFieldBarChart, setXFieldBarChart] = useState("Calories");
  const [xFieldScatterPlot, setXFieldScatterPlot] = useState("Calories");
  const [yField, setYField] = useState("ProteinContent");

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading data</p>;

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

  return (
    <>
      <div className="px-4 md:px-8 pb-6">
        <div className="mb-4">
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
                    <SelectItem value="Calories">Calories</SelectItem>
                    <SelectItem value="FatContent">Fat Content</SelectItem>
                    <SelectItem value="ProteinContent">
                      Protein Content
                    </SelectItem>
                    <SelectItem value="CarbohydrateContent">
                      Carbohydrate Content
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
            </div>

            <CardContent className="w-full min-w-0 overflow-hidden">
              <BarChart
                data={data}
                selectedCategories={selectedCategories.map((c) => c.name)}
                topN={topN}
                xField={xFieldBarChart}
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
                    <SelectItem value="Calories">Calories</SelectItem>
                    <SelectItem value="FatContent">Fat Content</SelectItem>
                    <SelectItem value="ProteinContent">
                      Protein Content
                    </SelectItem>
                    <SelectItem value="CarbohydrateContent">
                      Carbohydrate Content
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
                    <SelectItem value="Calories">Calories</SelectItem>
                    <SelectItem value="FatContent">Fat Content</SelectItem>
                    <SelectItem value="ProteinContent">
                      Protein Content
                    </SelectItem>
                    <SelectItem value="CarbohydrateContent">
                      Carbohydrate Content
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
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

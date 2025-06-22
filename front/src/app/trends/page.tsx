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
  const [selectedCategories, setSelectedCategories] = useState<
    { name: string }[]
  >([{ name: "All" }]);

  const [open, setOpen] = useState(false);
  const [topN, setTopN] = useState(10);
  const [xField, setXField] = useState("Calories");
  const [yField, setYField] = useState("ProteinContent");

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading data</p>;

  const rawCategories = Array.from(
    new Set(data.map((d: any) => d.RecipeCategory).filter(Boolean))
  ).map((name) => ({ name }));

  const allCategories = [{ name: "All" }, ...rawCategories];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Multiselect
          data={allCategories}
          open={open}
          onOpenChange={setOpen}
          modal={false}
          optionKey="name"
          optionValue="name"
          optionLabel="name"
          selectedOptions={selectedCategories}
          onSelect={(item) => {
            if (item.name === "All") {
              setSelectedCategories([{ name: "All" }]);
              return;
            }

            let newSelected = selectedCategories.filter(
              (c) => c.name !== "All"
            );

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
          }}
          onRemove={(item) => {
            if (item.name === "All") {
              setSelectedCategories([]);
              return;
            }
            setSelectedCategories(
              selectedCategories.filter(
                (c) => c.name !== item.name && c.name !== "All"
              )
            );
          }}
          buttonPlaceholder="Select categories"
          filterPlaceholder="Filter categories..."
        />

        <div className="flex gap-4 items-stretch">
          <Card className="h-full">
            <CardContent className="h-full flex items-start justify-center">
              <div className="w-full max-w-[200px]">
                <label className="text-base font-semibold">X Field</label>
                <Select value={xField} onValueChange={setXField}>
                  <SelectTrigger className="w-full h-9 text-sm">
                    <SelectValue placeholder="Choose the field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Calories">Calories</SelectItem>
                    <SelectItem value="FatContent">Fat Content</SelectItem>
                    <SelectItem value="ProteinContent">Protein Content</SelectItem>
                    <SelectItem value="CarbohydrateContent">
                      Carbohydrate Content
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardContent className="h-full flex items-start justify-center">
              <div className="w-full max-w-[200px]">
                <label className="text-base font-semibold">Y Field</label>
                <Select value={yField} onValueChange={setYField}>
                  <SelectTrigger className="w-full h-9 text-sm">
                    <SelectValue placeholder="Choose the field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Calories">Calories</SelectItem>
                    <SelectItem value="FatContent">Fat Content</SelectItem>
                    <SelectItem value="ProteinContent">Protein Content</SelectItem>
                    <SelectItem value="CarbohydrateContent">
                      Carbohydrate Content
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardContent className="h-full flex flex-col items-center justify-center max">
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
                className="border rounded p-2 w-24 h-9 text-center"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="text-center">
          {/* <CardTitle>Num sei</CardTitle> */}
        </CardHeader>
        <CardContent>
          <BarChart
            data={data}
            selectedCategories={selectedCategories.map((c) => c.name)}
            topN={topN}
            xField={xField}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <ScatterPlot
            data={data}
            selectedCategories={selectedCategories.map((c) => c.name)}
            topN={topN}
            xField={xField}
            yField={yField}
          />
        </CardContent>
      </Card>
    </div>
  );
}

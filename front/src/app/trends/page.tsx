"use client";

import useSWR from "swr";
import dynamic from "next/dynamic";

interface Recipe {
  RecipeCategory: string;
  DatePublished: string;
  // ...outros campos se necessário
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Importa dinamicamente o LineChart para evitar problemas de SSR
const LineChart = dynamic(() => import("../../components/charts/LineChart"), { ssr: false });

export default function TrendsPage() {
  const {
    data = [],
    error,
    isLoading,
  } = useSWR<Recipe[]>("/api/recipes", fetcher);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading data</p>;

  return (
    <>
      <div className="px-4 md:px-8 pb-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Now analyze general trends!
          </h1>
          <p className="text-muted-foreground text-base mt-1">
            Recipes aggregated per category, and other insights!
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Recipes per Year</h2>
          <LineChart data={data} />
        </div>
      </div>
    </>
  );
}
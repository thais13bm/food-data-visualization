"use client";

import useSWR from "swr";

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
      </div>
    </>
  );
}

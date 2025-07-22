"use client";

import ImageCarousel from "@/components/image_slide";
import useSWR from "swr";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { LoadingOverlay } from "@/components/common/loading-overlay";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const { data, error, isLoading } = useSWR("/api/recipes", fetcher);

  if (isLoading)
    return (
      <div className="fixed inset-0 z-50">
        <LoadingOverlay message="Loading data..." />
      </div>
    );

  if (error) return <p className="p-6 text-red-500">Error loading data!</p>;

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-10">
      <header>
        <h2 className="text-4xl font-extrabold mb-2">Welcome to RecipeViz!</h2>
        <p className="text-lg text-gray-700">
          Interactive web system for recipe analysis. Explore data
          visualizations and discover interesting insights. (Source:{" "}
          <a
            href="https://www.food.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            Food.com
          </a>
          )
        </p>
      </header>

      {data &&
        data.length > 0 &&
        (() => {
          const recipes = data
            .map((recipe) => {
              try {
                const parsed = JSON.parse(recipe.Images.replace(/'/g, '"'));
                return {
                  img: parsed?.[0],
                  name: recipe.Name,
                  autor: recipe.AuthorName,
                  igredients: recipe.RecipeIngredientParts,
                  category: recipe.RecipeCategory,
                };
              } catch {
                return null;
              }
            })
            .filter((r) => r?.img && r.img.startsWith("http"));

          return (
            <Card className="bg-slate-50 text-slate-800 border border-slate-200 shadow">
              <CardContent className="p-4">
                <ImageCarousel recipes={recipes} />
              </CardContent>
            </Card>
          );
        })()}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
        <Link href="/recipes" className="h-full">
          <Card className="h-full hover:shadow-lg transition cursor-pointer bg-blue-50">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">
                Recipes insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Individual recipes</p>
            </CardContent>
          </Card>
        </Link>

        
        <Link href="/trends" className="h-full">
          <Card className="h-full hover:shadow-lg transition cursor-pointer bg-blue-50">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">
                Categories nutrients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Analysis by dish type: dessert, vegetables etc.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/ingredients" className="h-full">
          <Card className="h-full hover:shadow-lg transition cursor-pointer bg-blue-50">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">
                Ingredients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Distribution of most used ingredients</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/time_series" className="h-full">
          <Card className="h-full hover:shadow-lg transition cursor-pointer bg-blue-50">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">
                Time series
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Temporal analysis</p>
            </CardContent>
          </Card>
        </Link>

      </section>
    </div>
  );
}

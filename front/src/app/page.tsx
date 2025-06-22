"use client";

import ImageCarousel from "@/components/image_slide";
import useSWR from "swr";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const { data, error, isLoading } = useSWR("/api/recipes", fetcher);

  if (isLoading)
    return <p className="p-6 text-gray-700">Carregando receitas...</p>;
  if (error) return <p className="p-6 text-red-500">Erro ao carregar dados!</p>;

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-10">
      <header>
        <h2 className="text-4xl font-extrabold mb-2">
          Bem-vindo ao ReceitaVis!
        </h2>
        <p className="text-lg text-gray-700">
          Sistema web interativo de análise de receitas. Explore as
          visualizações dos dados e descubra insights interessantes.
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

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card className="hover:shadow-lg transition cursor-pointer bg-blue-50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Visão Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Resumo rápido com gráficos básicos sobre o dataset de receitas.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition cursor-pointer bg-blue-50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Ingredientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Distribuição dos ingredientes mais usados nas receitas.</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition cursor-pointer bg-blue-50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Categorias</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Análise por tipo de prato: doces, salgados, veganos, etc.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

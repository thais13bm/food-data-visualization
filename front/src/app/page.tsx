"use client";
import ImageCarousel from "@/components/image_slide";
import useSWR from "swr";

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
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Sistema web interativo de análise de receitas. Explore as
          visualizações dos dados e descubra insights interessantes.
        </p>
      </header>

      {data &&
        data.length > 0 &&
        (() => {
          const images = data
            .map((recipe) => {
              try {
                const parsed = JSON.parse(recipe.Images.replace(/'/g, '"'));
                return parsed?.[0];
              } catch {
                return null;
              }
            })
            .filter((url) => url && url.startsWith("http"));
          return (
            <section className="bg-white dark:bg-gray-900 p-2 rounded-lg shadow">
              {/* <h3 className="text-2xl font-semibold mb-2">
                Imagens de Receitas
              </h3> */}
              <ImageCarousel images={images} />
            </section>
          );
        })()}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-teal-100 dark:bg-teal-900 p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer">
          <h3 className="text-xl font-semibold mb-3">Visão Geral</h3>
          <p>Resumo rápido com gráficos básicos sobre o dataset de receitas.</p>
        </div>

        <div className="bg-teal-100 dark:bg-teal-900 p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer">
          <h3 className="text-xl font-semibold mb-3">Ingredientes</h3>
          <p>Distribuição dos ingredientes mais usados nas receitas.</p>
        </div>

        <div className="bg-teal-100 dark:bg-teal-900 p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer">
          <h3 className="text-xl font-semibold mb-3">Categorias</h3>
          <p>Análise por tipo de prato: doces, salgados, veganos, etc.</p>
        </div>
      </section>
    </div>
  );
}

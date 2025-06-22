"use client";

import CaloriesBarChart from "@/components/charts/calories_barchart";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TrendsPage() {
  const { data, error, isLoading } = useSWR("/api/recipes", fetcher);

  if (isLoading) return <p className="p-6">Carregando receitas...</p>;
  if (error)
    return <p className="p-6 text-red-500">Erro ao carregar receitas.</p>;


  const chartData = (data ?? [])
    .map((item: any) => ({
      Name: item.Name || item.name || "Sem nome",
      calories: Number(item.calories ?? item.Calories ?? 0),
    }))
    .filter((d) => !isNaN(d.calories));

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Tendências</h1>

      <section className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">
          Top 10 Receitas com Mais Calorias
        </h2>
        <CaloriesBarChart data={chartData} />
      </section>
    </main>
  );
}

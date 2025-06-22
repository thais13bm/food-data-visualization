"use client";

export default function TopNav({
  onToggleDrawer,
}: {
  onToggleDrawer: () => void;
}) {
  return (
    <header className="flex items-center justify-between bg-gray-50 text-gray-900 p-4 shadow-md">
      <button
        onClick={onToggleDrawer}
        aria-label="Toggle Menu"
        className="text-2xl font-bold text-teal-600"
      >
        ☰
      </button>
      <h1 className="text-lg font-semibold text-teal-700">
        Sistema de Análise de Receitas
      </h1>
      <div>{/* espaço para perfil, busca etc */}</div>
    </header>
  );
}

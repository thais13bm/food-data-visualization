"use client";

export default function TopNav({ onToggleDrawer }: { onToggleDrawer: () => void }) {
  return (
    <header className="flex items-center justify-between bg-gray-800 text-white p-4">
      <button
        onClick={onToggleDrawer}
        aria-label="Toggle Menu"
        className="text-2xl font-bold"
      >
        ☰
      </button>
      <h1 className="text-lg font-semibold">Sistema de Análise de Receitas</h1>
      <div>{/* Aqui poderia ter mais coisas, perfil, busca... */}</div>
    </header>
  );
}

import Link from "next/link";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function Drawer({ open, onClose }: DrawerProps) {
  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-gray-800/20 z-20 transition-opacity ${
          open ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-50 shadow-lg z-30 transform transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="flex flex-col p-6 gap-6 text-gray-900">
          <h2 className="text-2xl font-bold mb-8 text-teal-600">RecipeViz</h2>
          <Link href="/" onClick={onClose} className="hover:text-teal-600">
            Home
          </Link>
          <Link
            href="/recipes"
            onClick={onClose}
            className="hover:text-teal-600"
          >
            Individual Recipes
          </Link>
          <Link
            href="/trends"
            onClick={onClose}
            className="hover:text-teal-600"
          >
            Category nutrients
          </Link>
          <Link
            href="/ingredients"
            onClick={onClose}
            className="hover:text-teal-600"
          >
            Ingredients
          </Link>
          <Link
            href="/time_series"
            onClick={onClose}
            className="hover:text-teal-600"
          >
            Time series
          </Link>
        </nav>
      </aside>
    </>
  );
}

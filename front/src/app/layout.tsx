"use client";

import TopNav from "@/components/topnav";
import "./globals.css";
import Drawer from "@/components/drawer";
import { useState } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  function toggleDrawer() {
    setDrawerOpen((open) => !open);
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 dark:bg-gray-800 min-h-screen">
        <TopNav onToggleDrawer={toggleDrawer} />
        <Drawer open={drawerOpen} onClose={closeDrawer} />
        <main
          className={`pt-6 transition-margin duration-300 ${
            drawerOpen ? "ml-64" : "ml-0"
          }`}
          style={{ zIndex: 0, position: "relative" }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}

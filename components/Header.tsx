"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-4xl items-center gap-8 px-4 py-4">
        <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Dash Finance
        </span>
        <nav className="flex items-center gap-5">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors ${
              pathname === "/"
                ? "text-zinc-900 dark:text-zinc-50"
                : "text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-50"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/relatorio"
            className={`text-sm font-medium transition-colors ${
              pathname === "/relatorio"
                ? "text-zinc-900 dark:text-zinc-50"
                : "text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-50"
            }`}
          >
            Relatório
          </Link>
          <Link
            href="/fundos"
            className={`text-sm font-medium transition-colors ${
              pathname === "/fundos"
                ? "text-zinc-900 dark:text-zinc-50"
                : "text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-50"
            }`}
          >
            Fundos
          </Link>
        </nav>
      </div>
    </header>
  );
}

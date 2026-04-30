"use client";

import clsx from "clsx";
import { ClipboardList, Factory, PackageOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/production-status",
    label: "Production Status",
    icon: Factory
  },
  {
    href: "/purchase-orders",
    label: "Purchase Orders",
    icon: ClipboardList
  },
  {
    href: "/supply-orders",
    label: "Supply Orders",
    icon: PackageOpen
  }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-slate-950 text-white md:min-h-screen md:w-64">
      <div className="flex items-center justify-between px-5 py-5 md:block">
        <Link href="/production-status" className="text-lg font-bold">
          ACME Bottles
        </Link>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-4 md:block md:space-y-1 md:overflow-visible">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon aria-hidden className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

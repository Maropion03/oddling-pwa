"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookHeart, Home, UserRound } from "lucide-react";
import { clsx } from "clsx";
import { Wordmark } from "@/components/brand/wordmark";

const nav = [
  { href: "/home", label: "巢穴", icon: Home },
  { href: "/album", label: "贴纸册", icon: BookHeart },
  { href: "/me", label: "我的", icon: UserRound },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="app-frame">
      <aside className="side-nav" aria-label="主要导航">
        <Wordmark compact />
        <nav>
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={clsx("nav-link", active && "is-active")} aria-current={active ? "page" : undefined}>
                <Icon size={20} strokeWidth={2.4}/><span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="app-main">{children}</main>
      <nav className="bottom-nav" aria-label="主要导航">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={clsx("nav-link", active && "is-active")} aria-current={active ? "page" : undefined}>
              <Icon size={22} strokeWidth={2.4}/><span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/#concept", label: "コンセプト" },
  { href: "/sessions", label: "セッション" },
  { href: "/ticket", label: "チケット" },
  { href: "/#news", label: "お知らせ" },
  { href: "/date-venue", label: "日程・会場" },
  { href: "/mypage", label: "マイページ" },
];

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return false;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav
      className="fixed w-full z-50 nav-blur transition-all duration-300"
      id="navbar"
    >
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm font-semibold tracking-wide hover:opacity-70 transition-opacity"
        >
          JTF Translation Festival
        </Link>
        <div className="hidden md:flex space-x-8 text-xs font-medium text-gray-600">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive(item.href)
                  ? "text-black font-semibold"
                  : "hover:text-black transition-colors"
              }
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="md:hidden">
          <button className="text-gray-800">
            <i className="fas fa-bars"></i>
          </button>
        </div>
      </div>
    </nav>
  );
}

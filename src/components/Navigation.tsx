"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const baseNavItems = [
  { href: "/#concept", label: "コンセプト" },
  { href: "/sessions", label: "セッション" },
  { href: "/ticket", label: "チケット" },
  { href: "/#news", label: "お知らせ" },
  { href: "/date-venue", label: "日程・会場" },
];

export default function Navigation() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    async function loadRoles() {
      if (!user) {
        setRoles([]);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("roles")
        .eq("id", user.id)
        .single();

      if (data?.roles) {
        setRoles(data.roles);
      }
    }

    if (!loading) {
      loadRoles();
    }
  }, [user, loading]);

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return false;
    return pathname === href || pathname.startsWith(href + "/");
  };

  // Determine mypage link based on roles
  const getMypageLink = () => {
    if (!user) return { href: "/login", label: "ログイン" };

    // While roles are loading, default to /mypage
    if (roles.length === 0) {
      return { href: "/mypage", label: "マイページ" };
    }

    // If user has purchaser role (even if also attendee), show purchaser mypage
    if (roles.includes("purchaser")) {
      return { href: "/mypage", label: "マイページ" };
    }

    // If user only has attendee role, show attendee page
    if (roles.includes("attendee")) {
      return { href: "/attendee", label: "マイページ" };
    }

    // Default to mypage
    return { href: "/mypage", label: "マイページ" };
  };

  const mypageItem = getMypageLink();
  const navItems = [...baseNavItems, mypageItem];

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

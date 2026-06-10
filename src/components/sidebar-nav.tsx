"use client";

import Link from "next/link";
import { BarChart3, FileSearch, MailCheck, Newspaper, Radar, Settings } from "lucide-react";
import { usePathname } from "next/navigation";

const navGroups = [
  {
    label: "Dashboards",
    items: [["Overview", "/", BarChart3]]
  },
  {
    label: "General",
    items: [
      ["Leads", "/leads", Radar],
      ["Email Log", "/email-log", MailCheck],
      ["Articles", "/articles", FileSearch],
      ["Sources", "/sources", Newspaper],
      ["Settings", "/settings", Settings]
    ]
  }
] as const;

export function SidebarNav() {
  const pathname = usePathname() ?? "/";

  return (
    <nav className="nav">
      {navGroups.map((group) => (
        <div className="nav-group" key={group.label}>
          <p className="nav-group-label">{group.label}</p>
          {group.items.map(([label, href, Icon]) => {
            const active = href === "/" ? pathname === href : pathname.startsWith(href);
            return (
              <Link className={active ? "active" : undefined} key={href} href={href}>
                <Icon size={18} /> {label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  GitBranch,
  Ticket,
  QrCode,
  CalendarDays,
  Wallet,
  Trophy,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";

const menu = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    href: "/dashboard/users",
    icon: Users,
  },
  {
    title: "Memberships",
    href: "/dashboard/memberships",
    icon: CreditCard,
  },
  {
    title: "Referrals",
    href: "/dashboard/referrals",
    icon: GitBranch,
  },
  {
    title: "Guest Passes",
    href: "/dashboard/guest-passes",
    icon: Ticket,
  },
  {
    title: "Attendance",
    href: "/dashboard/attendance",
    icon: QrCode,
  },
  {
    title: "Events",
    href: "/dashboard/events",
    icon: CalendarDays,
  },
  {
    title: "Payments",
    href: "/dashboard/payments",
    icon: Wallet,
  },
  {
    title: "Rewards",
    href: "/dashboard/rewards",
    icon: Trophy,
  },
];

export default function AdminSidebar({ open, onClose }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 h-screen w-64
          border-r border-white/10
          bg-[#120d1b]
          font-sans
          transition-transform duration-300
          lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center justify-between px-6 border-b border-white/10">
            <Link
              href="/dashboard"
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b9d63b] text-black font-black">
                P
              </div>

              <div>
                <h1 className="text-lg font-bold text-white">
                  PURPLE
                </h1>

                <p className="text-[10px] tracking-[0.2em] text-white/40">
                  ADMIN
                </p>
              </div>
            </Link>

            <button
              onClick={onClose}
              className="text-white/50 hover:text-white lg:hidden"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-5">
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
              Management
            </p>

            <div className="space-y-1">
              {menu.map((item) => {
                const Icon = item.icon;

                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 rounded-xl
                      px-3 py-3 text-sm font-medium
                      transition-all
                      ${
                        active
                          ? "bg-[#b9d63b] text-black shadow-lg shadow-[#b9d63b]/10"
                          : "text-white/60 hover:bg-white/5 hover:text-white"
                      }
                    `}
                  >
                    <Icon size={18} />

                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-8">
              <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
                System
              </p>

              <Link
                href="/admin/settings"
                onClick={onClose}
                className={`
                  flex items-center gap-3 rounded-xl
                  px-3 py-3 text-sm font-medium
                  transition-all
                  ${
                    pathname.startsWith("/admin/settings")
                      ? "bg-[#b9d63b] text-black"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }
                `}
              >
                <Settings size={18} />
                <span>Settings</span>
              </Link>
            </div>
          </nav>

          {/* Bottom */}
          <div className="border-t border-white/10 p-4">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
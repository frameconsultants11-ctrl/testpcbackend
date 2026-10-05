"use client";

import { Bell, Menu } from "lucide-react";

export default function AdminHeader({
  session,
  onMenuClick,
}) {
  const name = session?.user?.name || "Admin";

  return (
    <header className="sticky top-0 z-30 h-20 border-b border-white/10 bg-[#0d0913]/90 backdrop-blur-xl font-sans">
      <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Mobile Menu */}
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2 text-white/60 hover:bg-white/5 hover:text-white lg:hidden"
        >
          <Menu size={22} />
        </button>

        {/* Desktop Welcome */}
        <div className="hidden lg:block">
          <p className="text-sm text-white/40">
            Welcome back
          </p>

          <h2 className="text-lg font-semibold text-white">
            {name}
          </h2>
        </div>

        {/* Right */}
        <div className="ml-auto flex items-center gap-4">
          <button
            type="button"
            className="relative rounded-xl p-2.5 text-white/50 hover:bg-white/5 hover:text-white"
          >
            <Bell size={20} />

            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#b9d63b]" />
          </button>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#b9d63b] font-bold text-black">
            {name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
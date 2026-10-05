import {
  Users,
  CreditCard,
  GitBranch,
  Wallet,
  ArrowUpRight,
  UserPlus,
  QrCode,
} from "lucide-react";

const stats = [
  {
    title: "Total Users",
    value: "0",
    change: "Registered users",
    icon: Users,
  },
  {
    title: "Active Members",
    value: "0",
    change: "Current memberships",
    icon: CreditCard,
  },
  {
    title: "Successful Referrals",
    value: "0",
    change: "Membership conversions",
    icon: GitBranch,
  },
  {
    title: "Revenue",
    value: "₹0",
    change: "Total collected",
    icon: Wallet,
  },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <div>
        <p className="text-sm text-[#b9d63b] font-medium">
          Overview
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Dashboard
        </h1>

        <p className="mt-2 text-sm text-white/40">
          Monitor your Purple community and membership activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#b9d63b]/10 text-[#b9d63b]">
                  <Icon size={21} />
                </div>

                <ArrowUpRight
                  size={17}
                  className="text-white/20"
                />
              </div>

              <div className="mt-6">
                <p className="text-sm text-white/40">
                  {stat.title}
                </p>

                <h2 className="mt-1 text-3xl font-bold">
                  {stat.value}
                </h2>

                <p className="mt-2 text-xs text-white/30">
                  {stat.change}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Recent Members */}
        <div className="xl:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="flex items-center justify-between border-b border-white/10 p-5">
            <div>
              <h2 className="font-semibold">
                Recent Members
              </h2>

              <p className="mt-1 text-xs text-white/30">
                Latest membership activity
              </p>
            </div>

            <a
              href="/admin/users"
              className="text-xs font-medium text-[#b9d63b] hover:underline"
            >
              View all
            </a>
          </div>

          <div className="flex min-h-[250px] items-center justify-center p-6">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                <Users
                  size={20}
                  className="text-white/30"
                />
              </div>

              <p className="mt-4 text-sm text-white/40">
                No members yet
              </p>

              <p className="mt-1 text-xs text-white/20">
                Members will appear here once they join.
              </p>
            </div>
          </div>
        </div>

        {/* Referral Overview */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="border-b border-white/10 p-5">
            <h2 className="font-semibold">
              Referral Overview
            </h2>

            <p className="mt-1 text-xs text-white/30">
              Membership referral progress
            </p>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#b9d63b]/10">
                  <GitBranch
                    size={25}
                    className="text-[#b9d63b]"
                  />
                </div>

                <p className="mt-4 text-3xl font-bold">
                  0
                </p>

                <p className="mt-1 text-xs text-white/30">
                  Successful referrals
                </p>
              </div>
            </div>

            <div className="border-t border-white/10 pt-5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">
                  Next milestone
                </span>

                <span className="font-semibold text-[#b9d63b]">
                  10 referrals
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-[#b9d63b]"
                  style={{ width: "0%" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">
          Quick Actions
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <a
            href="/admin/users"
            className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-[#b9d63b]/30 hover:bg-[#b9d63b]/5"
          >
            <UserPlus
              size={20}
              className="text-[#b9d63b]"
            />

            <p className="mt-4 font-medium">
              Manage Users
            </p>

            <p className="mt-1 text-xs text-white/30">
              View and manage community members
            </p>
          </a>

          <a
            href="/admin/memberships"
            className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-[#b9d63b]/30 hover:bg-[#b9d63b]/5"
          >
            <CreditCard
              size={20}
              className="text-[#b9d63b]"
            />

            <p className="mt-4 font-medium">
              Memberships
            </p>

            <p className="mt-1 text-xs text-white/30">
              Manage memberships and plans
            </p>
          </a>

          <a
            href="/admin/events"
            className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-[#b9d63b]/30 hover:bg-[#b9d63b]/5"
          >
            <CreditCard
              size={20}
              className="text-[#b9d63b]"
            />

            <p className="mt-4 font-medium">
              Events
            </p>

            <p className="mt-1 text-xs text-white/30">
              Manage Sunday experiences
            </p>
          </a>

          <a
            href="/admin/attendance"
            className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-[#b9d63b]/30 hover:bg-[#b9d63b]/5"
          >
            <QrCode
              size={20}
              className="text-[#b9d63b]"
            />

            <p className="mt-4 font-medium">
              Attendance
            </p>

            <p className="mt-1 text-xs text-white/30">
              Check-ins and QR attendance
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
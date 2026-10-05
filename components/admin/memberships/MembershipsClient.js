"use client";

import { useEffect, useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Users,
  CalendarDays,
} from "lucide-react";

export default function MembershipsClient() {
  const [memberships, setMemberships] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("all");

  const [page, setPage] =
    useState(1);

  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });

  async function fetchMemberships() {
    try {
      setLoading(true);

      const params =
        new URLSearchParams();

      if (search) {
        params.set("search", search);
      }

      params.set("status", status);
      params.set("page", page);
      params.set("limit", 20);

      const response =
        await fetch(
          `/api/admin/memberships?${params.toString()}`,
          {
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch memberships"
        );
      }

      setMemberships(
        data.memberships || []
      );

      setPagination(
        data.pagination
      );
    } catch (error) {
      console.error(
        "FETCH MEMBERSHIPS ERROR:",
        error
      );

      setMemberships([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMemberships();
  }, [page, status]);

  useEffect(() => {
    const timeout =
      setTimeout(() => {
        setPage(1);
        fetchMemberships();
      }, 400);

    return () =>
      clearTimeout(timeout);
  }, [search]);

  function formatDate(date) {
    if (!date) return "-";

    return new Date(
      date
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getStatusClass(
    membershipStatus
  ) {
    switch (
      membershipStatus?.toUpperCase()
    ) {
      case "ACTIVE":
        return "bg-[#b9d63b]/10 text-[#b9d63b]";

      case "EXPIRED":
        return "bg-red-500/10 text-red-400";

      case "CANCELLED":
        return "bg-yellow-500/10 text-yellow-400";

      default:
        return "bg-white/10 text-white/60";
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}

      <div>
        <h1 className="text-2xl font-bold text-white">
          Memberships
        </h1>

        <p className="mt-1 text-sm text-white/40">
          Manage Purple memberships and
          subscription activity.
        </p>
      </div>

      {/* Stats */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#b9d63b]/10 p-3">
              <CreditCard
                size={20}
                className="text-[#b9d63b]"
              />
            </div>

            <div>
              <p className="text-sm text-white/40">
                Total Memberships
              </p>

              <p className="text-2xl font-bold">
                {pagination.total}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#b9d63b]/10 p-3">
              <Users
                size={20}
                className="text-[#b9d63b]"
              />
            </div>

            <div>
              <p className="text-sm text-white/40">
                Showing
              </p>

              <p className="text-2xl font-bold">
                {memberships.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#b9d63b]/10 p-3">
              <CalendarDays
                size={20}
                className="text-[#b9d63b]"
              />
            </div>

            <div>
              <p className="text-sm text-white/40">
                Current Page
              </p>

              <p className="text-2xl font-bold">
                {pagination.page}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Filters */}

      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:flex-row">

        <div className="relative flex-1">

          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
          />

          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search member, email, mobile..."
            className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#b9d63b]/40"
          />

        </div>

        <select
          value={status}
          onChange={(e) => {
            setStatus(
              e.target.value
            );
            setPage(1);
          }}
          className="h-11 rounded-xl border border-white/10 bg-[#17111f] px-4 text-sm text-white outline-none"
        >
          <option value="all">
            All Status
          </option>

          <option value="active">
            Active
          </option>

          <option value="expired">
            Expired
          </option>

          <option value="cancelled">
            Cancelled
          </option>
        </select>

      </div>

      {/* Table */}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[900px]">

            <thead>
              <tr className="border-b border-white/10 text-left">

                <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-white/40">
                  Member
                </th>

                <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-white/40">
                  Plan
                </th>

                <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-white/40">
                  Amount
                </th>

                <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-white/40">
                  Experiences
                </th>

                <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-white/40">
                  Start Date
                </th>

                <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-white/40">
                  Status
                </th>

              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-12 text-center text-sm text-white/40"
                  >
                    Loading memberships...
                  </td>
                </tr>
              ) : memberships.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-12 text-center text-sm text-white/40"
                  >
                    No memberships found.
                  </td>
                </tr>
              ) : (
                memberships.map(
                  (membership) => {

                    const member =
                      membership.member;

                    return (
                      <tr
                        key={
                          membership._id
                        }
                        className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                      >

                        <td className="px-5 py-4">

                          <div>
                            <p className="font-medium text-white">
                              {member?.name ||
                                "Unknown Member"}
                            </p>

                            <p className="mt-1 text-xs text-white/40">
                              {member?.email ||
                                member?.mobile ||
                                "-"}
                            </p>
                          </div>

                        </td>

                        <td className="px-5 py-4">

                          <span className="text-sm text-white">
                            {membership.plan ===
                            "PURPLE_MONTH"
                              ? "Purple Membership"
                              : membership.plan ===
                                "PURPLE_RECHARGE"
                              ? "Purple Recharge"
                              : membership.plan}
                          </span>

                        </td>

                        <td className="px-5 py-4 text-sm text-white">
                          ₹
                          {membership.amount?.toLocaleString(
                            "en-IN"
                          )}
                        </td>

                        <td className="px-5 py-4">

                          <span className="text-sm text-white">
                            {membership
                              .sundayExperiences
                              ?.used || 0}
                            /
                            {membership
                              .sundayExperiences
                              ?.total || 0}
                          </span>

                        </td>

                        <td className="px-5 py-4 text-sm text-white/60">
                          {formatDate(
                            membership.startDate
                          )}
                        </td>

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                              membership.status
                            )}`}
                          >
                            {
                              membership.status
                            }
                          </span>

                        </td>

                      </tr>
                    );
                  }
                )
              )}

            </tbody>

          </table>

        </div>

        {/* Pagination */}

        {!loading &&
          pagination.totalPages > 0 && (
            <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">

              <p className="text-sm text-white/40">
                Page{" "}
                {pagination.page}{" "}
                of{" "}
                {
                  pagination.totalPages
                }
              </p>

              <div className="flex gap-2">

                <button
                  disabled={
                    pagination.page <= 1
                  }
                  onClick={() =>
                    setPage(
                      (prev) =>
                        prev - 1
                    )
                  }
                  className="rounded-xl border border-white/10 p-2 text-white/60 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft
                    size={18}
                  />
                </button>

                <button
                  disabled={
                    pagination.page >=
                    pagination.totalPages
                  }
                  onClick={() =>
                    setPage(
                      (prev) =>
                        prev + 1
                    )
                  }
                  className="rounded-xl border border-white/10 p-2 text-white/60 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronRight
                    size={18}
                  />
                </button>

              </div>

            </div>
          )}

      </div>

    </div>
  );
}
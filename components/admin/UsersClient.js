"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Search,
  Users,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Eye,
  CreditCard,
  X,
} from "lucide-react";

export default function UsersClient() {
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("all");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Membership modal
  const [membershipModal, setMembershipModal] =
    useState(false);

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [creatingMembership, setCreatingMembership] =
    useState(false);

  const [membershipError, setMembershipError] =
    useState("");

  const [membershipSuccess, setMembershipSuccess] =
    useState("");

  async function fetchUsers() {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (search) {
        params.set("search", search);
      }

      params.set("status", status);
      params.set("page", page);
      params.set("limit", 20);

      const response = await fetch(
        `/api/admin/users?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch users"
        );
      }

      setUsers(data.users || []);

      setPagination(
        data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        }
      );
    } catch (error) {
      console.error(
        "FETCH USERS ERROR:",
        error
      );

      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, [page, status]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      fetchUsers();
    }, 400);

    return () => clearTimeout(timeout);
  }, [search]);

  /*
   * Open membership modal
   */
  function openMembershipModal(user) {
    setSelectedUser(user);

    setMembershipError("");

    setMembershipSuccess("");

    setMembershipModal(true);
  }

  /*
   * Close membership modal
   */
  function closeMembershipModal() {
    if (creatingMembership) {
      return;
    }

    setMembershipModal(false);

    setSelectedUser(null);

    setMembershipError("");

    setMembershipSuccess("");
  }

  /*
   * Create ₹1,499 membership
   */
  async function createMembership() {
    if (!selectedUser?._id) {
      setMembershipError(
        "Member information is missing."
      );

      return;
    }

    try {
      setCreatingMembership(true);

      setMembershipError("");

      setMembershipSuccess("");

      const response = await fetch(
        "/api/admin/memberships",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            memberId:
              selectedUser._id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMembershipError(
          data.message ||
            "Failed to create membership."
        );

        return;
      }

      setMembershipSuccess(
        "₹1,499 membership activated successfully."
      );

      /*
       * Refresh users after successful
       * membership creation.
       */
      await fetchUsers();

      /*
       * Close after showing success
       */
      setTimeout(() => {
        setMembershipModal(false);
        setSelectedUser(null);
        setMembershipSuccess("");
      }, 1200);
    } catch (error) {
      console.error(
        "CREATE MEMBERSHIP ERROR:",
        error
      );

      setMembershipError(
        "Something went wrong. Please try again."
      );
    } finally {
      setCreatingMembership(false);
    }
  }

  return (
    <>
      <div className="space-y-6">

        {/* Header */}

        <div>
          <h1 className="text-2xl font-bold text-white">
            Users
          </h1>

          <p className="mt-1 text-sm text-white/40">
            Manage Purple members from the
            admin panel.
          </p>
        </div>

        {/* Stats */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          {/* Total */}

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
                  Total Members
                </p>

                <p className="text-2xl font-bold text-white">
                  {pagination.total}
                </p>
              </div>

            </div>
          </div>

          {/* Showing */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-[#b9d63b]/10 p-3">
                <UserCheck
                  size={20}
                  className="text-[#b9d63b]"
                />
              </div>

              <div>
                <p className="text-sm text-white/40">
                  Showing
                </p>

                <p className="text-2xl font-bold text-white">
                  {users.length}
                </p>
              </div>

            </div>
          </div>

          {/* Page */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-[#b9d63b]/10 p-3">
                <UserX
                  size={20}
                  className="text-[#b9d63b]"
                />
              </div>

              <div>
                <p className="text-sm text-white/40">
                  Current Page
                </p>

                <p className="text-2xl font-bold text-white">
                  {pagination.page}
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* Filters */}

        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:flex-row">

          {/* Search */}

          <div className="relative flex-1">

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search name, email, mobile or referral code..."
              className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#b9d63b]/40"
            />

          </div>

          {/* Status */}

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
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

            <option value="inactive">
              Inactive
            </option>
          </select>

        </div>

        {/* Table */}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1050px]">

              <thead>
                <tr className="border-b border-white/10 text-left">

                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-white/40">
                    Member
                  </th>

                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-white/40">
                    Contact
                  </th>

                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-white/40">
                    Referral Code
                  </th>

                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-white/40">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-white/40">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody>

                {loading ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-14 text-center text-sm text-white/40"
                    >
                      Loading members...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-14 text-center text-sm text-white/40"
                    >
                      No members found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <UserRow
                      key={user._id}
                      user={user}
                      onMembership={() =>
                        openMembershipModal(
                          user
                        )
                      }
                    />
                  ))
                )}

              </tbody>

            </table>

          </div>

          {/* Pagination */}

          {!loading &&
            pagination.totalPages > 0 && (
              <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">

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
                    type="button"
                    disabled={
                      pagination.page <=
                      1
                    }
                    onClick={() =>
                      setPage(
                        (prev) =>
                          prev - 1
                      )
                    }
                    className="rounded-xl border border-white/10 p-2 text-white/60 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronLeft
                      size={18}
                    />
                  </button>

                  <button
                    type="button"
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
                    className="rounded-xl border border-white/10 p-2 text-white/60 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
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

      {/* ================================================= */}
      {/* MEMBERSHIP MODAL */}
      {/* ================================================= */}

      {membershipModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !creatingMembership
            ) {
              closeMembershipModal();
            }
          }}
        >

          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#17111f] shadow-2xl">

            {/* Header */}

            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">

              <div>
                <h2 className="text-lg font-semibold text-white">
                  Activate Membership
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  Create the ₹1,499 Purple
                  Membership.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeMembershipModal
                }
                disabled={
                  creatingMembership
                }
                className="rounded-lg p-2 text-white/40 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X size={20} />
              </button>

            </div>

            {/* Body */}

            <div className="space-y-5 p-6">

              {/* Selected Member */}

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">

                <p className="text-xs uppercase tracking-wider text-white/30">
                  Member
                </p>

                <p className="mt-2 font-semibold text-white">
                  {selectedUser?.name ||
                    "Unnamed User"}
                </p>

                <p className="mt-1 text-sm text-white/40">
                  {selectedUser?.email ||
                    selectedUser?.mobile ||
                    "—"}
                </p>

              </div>

              {/* Membership */}

              <div className="rounded-xl border border-[#b9d63b]/20 bg-[#b9d63b]/5 p-4">

                <div className="flex items-start justify-between gap-4">

                  <div>
                    <p className="font-semibold text-white">
                      Purple Membership
                    </p>

                    <p className="mt-1 text-xs leading-5 text-white/40">
                      4 Sunday experiences,
                      body composition
                      assessment, Purple Kit
                      and community access.
                    </p>
                  </div>

                  <p className="shrink-0 text-xl font-bold text-[#b9d63b]">
                    ₹1,499
                  </p>

                </div>

              </div>

              {/* Benefits */}

              <div className="grid grid-cols-2 gap-2">

                <div className="rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-white/50">
                  ✓ 4 Sunday Experiences
                </div>

                <div className="rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-white/50">
                  ✓ Body Assessment
                </div>

                <div className="rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-white/50">
                  ✓ Purple T-Shirt
                </div>

                <div className="rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-white/50">
                  ✓ Purple Shaker
                </div>

              </div>

              {/* Error */}

              {membershipError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {membershipError}
                </div>
              )}

              {/* Success */}

              {membershipSuccess && (
                <div className="rounded-xl border border-[#b9d63b]/20 bg-[#b9d63b]/10 px-4 py-3 text-sm text-[#b9d63b]">
                  {membershipSuccess}
                </div>
              )}

              {/* Actions */}

              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={
                    closeMembershipModal
                  }
                  disabled={
                    creatingMembership
                  }
                  className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white/60 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    createMembership
                  }
                  disabled={
                    creatingMembership ||
                    !!membershipSuccess
                  }
                  className="flex-1 rounded-xl bg-[#b9d63b] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#c7e34d] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {creatingMembership
                    ? "Activating..."
                    : "Activate ₹1,499"}
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </>
  );
}

/* ================================================= */
/* USER ROW */
/* ================================================= */

function UserRow({
  user,
  onMembership,
}) {
  return (
    <tr className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">

      {/* Member */}

      <td className="px-6 py-4">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#b9d63b]/10 text-sm font-semibold text-[#b9d63b]">
            {user?.name
              ?.charAt(0)
              ?.toUpperCase() || "U"}
          </div>

          <div className="min-w-0">

            <p className="truncate font-medium text-white">
              {user?.name ||
                "Unnamed Member"}
            </p>

            <p className="mt-1 text-xs text-white/40">
              {user?.city || "—"}
            </p>

          </div>

        </div>

      </td>

      {/* Contact */}

      <td className="px-6 py-4">

        <div>
          <p className="text-sm text-white">
            {user?.email || "—"}
          </p>

          <p className="mt-1 text-xs text-white/40">
            {user?.mobile || "—"}
          </p>
        </div>

      </td>

      {/* Referral */}

      <td className="px-6 py-4">

        <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-white/60">
          {user?.referralCode || "—"}
        </span>

      </td>

      {/* Status */}

      <td className="px-6 py-4">

        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
            user?.isActive
              ? "bg-[#b9d63b]/10 text-[#b9d63b]"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {user?.isActive
            ? "Active"
            : "Inactive"}
        </span>

      </td>

      {/* Actions */}

      <td className="px-6 py-4 text-right">

        <div className="flex items-center justify-end gap-2">

          <Link
            href={`/dashboard/users/${user._id}`}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60 transition hover:border-[#b9d63b]/30 hover:text-[#b9d63b]"
          >
            <Eye size={14} />
            View
          </Link>

          <button
            type="button"
            onClick={onMembership}
            className="inline-flex items-center gap-2 rounded-lg border border-[#b9d63b]/20 bg-[#b9d63b]/5 px-3 py-2 text-xs text-[#b9d63b] transition hover:bg-[#b9d63b]/10"
          >
            <CreditCard size={14} />
            Membership
          </button>

        </div>

      </td>

    </tr>
  );
}
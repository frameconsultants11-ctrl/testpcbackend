"use client";

import { useEffect, useState } from "react";

import {
  Search,
  RefreshCw,
  Users,
  UserCheck,
  Ticket,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  MapPin,
  Clock,
} from "lucide-react";

export default function AttendanceClient() {
  const [attendance, setAttendance] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [type, setType] = useState("ALL");

  const [status, setStatus] = useState("ALL");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [selectedAttendance, setSelectedAttendance] =
    useState(null);

  /*
   * ==========================================
   * FETCH
   * ==========================================
   */

  async function fetchAttendance() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      params.set("type", type);
      params.set("status", status);
      params.set("page", page.toString());
      params.set("limit", "20");

      const response = await fetch(
        `/api/admin/attendance?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to fetch attendance."
        );
      }

      setAttendance(result.attendance || []);

      setPagination(
        result.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        }
      );
    } catch (error) {
      console.error(
        "FETCH ATTENDANCE ERROR:",
        error
      );

      setError(
        error.message ||
          "Failed to fetch attendance."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAttendance();
  }, [page, type, status]);

  /*
   * ==========================================
   * SEARCH
   * ==========================================
   */

  function handleSearch(event) {
    event.preventDefault();

    setPage(1);

    fetchAttendance();
  }

  /*
   * ==========================================
   * COUNTS
   * ==========================================
   */

  const totalRecords =
    pagination.total || 0;

  const memberAttendance =
    attendance.filter(
      (item) =>
        item.type !== "GUEST_PASS"
    ).length;

  const guestAttendance =
    attendance.filter(
      (item) =>
        item.type === "GUEST_PASS"
    ).length;

  /*
   * ==========================================
   * UI
   * ==========================================
   */

  return (
    <div className="space-y-6">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between font-sans">

        <div>
          <h1 className="text-2xl font-bold text-white">
            Attendance
          </h1>

          <p className="mt-1 text-sm text-white/40">
            Monitor member and guest
            check-ins.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAttendance}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={
              loading ? "animate-spin" : ""
            }
          />

          Refresh
        </button>
      </div>

      {/* ======================================
          ERROR
      ====================================== */}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* ======================================
          STATS
      ====================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <StatCard
          icon={CalendarCheck}
          title="Total Records"
          value={totalRecords}
        />

        <StatCard
          icon={Users}
          title="Member Check-ins"
          value={memberAttendance}
        />

        <StatCard
          icon={Ticket}
          title="Guest Check-ins"
          value={guestAttendance}
        />

      </div>

      {/* ======================================
          FILTERS
      ====================================== */}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 lg:flex-row"
        >

          {/* SEARCH */}

          <div className="relative flex-1">

            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search member, guest, event, mobile or pass code..."
              className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#b9d63b]/40"
            />

          </div>

          {/* TYPE */}

          <select
            value={type}
            onChange={(event) => {
              setType(event.target.value);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-white/10 bg-[#17111f] px-4 text-sm text-white outline-none focus:border-[#b9d63b]/40"
          >
            <option value="ALL">
              All Types
            </option>

            <option value="EVENT">
              Member
            </option>

            <option value="MEMBER">
              Member
            </option>

            <option value="GUEST_PASS">
              Guest Pass
            </option>
          </select>

          {/* STATUS */}

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-white/10 bg-[#17111f] px-4 text-sm text-white outline-none focus:border-[#b9d63b]/40"
          >
            <option value="ALL">
              All Status
            </option>

            <option value="PRESENT">
              Present
            </option>

            <option value="ABSENT">
              Absent
            </option>
          </select>

          <button
            type="submit"
            className="h-11 rounded-xl bg-[#b9d63b] px-5 text-sm font-semibold text-black transition hover:bg-[#c8e64a]"
          >
            Search
          </button>

        </form>
      </section>

      {/* ======================================
          TABLE
      ====================================== */}

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">

        <div className="border-b border-white/10 px-6 py-5">

          <h2 className="font-semibold text-white">
            Attendance Records
          </h2>

          <p className="mt-1 text-sm text-white/40">
            Latest member and guest check-ins
          </p>

        </div>

        {loading ? (
          <div className="px-6 py-16 text-center">

            <RefreshCw
              size={25}
              className="mx-auto animate-spin text-[#b9d63b]"
            />

            <p className="mt-3 text-sm text-white/40">
              Loading attendance...
            </p>

          </div>
        ) : attendance.length === 0 ? (
          <div className="px-6 py-16 text-center">

            <CalendarCheck
              size={38}
              className="mx-auto text-white/15"
            />

            <p className="mt-4 font-medium text-white">
              No attendance records
            </p>

            <p className="mt-1 text-sm text-white/35">
              Check-ins will appear here.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[1050px]">

              <thead>

                <tr className="border-b border-white/10 text-left">

                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-white/30">
                    Person
                  </th>

                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-white/30">
                    Type
                  </th>

                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-white/30">
                    Event / Host
                  </th>

                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-white/30">
                    Status
                  </th>

                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-white/30">
                    Check-in
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-white/30">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {attendance.map((item) => {

                  const isGuest =
                    item.type ===
                    "GUEST_PASS";

                  const personName = isGuest
                    ? item.guest?.name ||
                      "Unknown Guest"
                    : item.member?.name ||
                      "Unknown Member";

                  const personMobile = isGuest
                    ? item.guest?.mobile ||
                      "—"
                    : item.member?.mobile ||
                      item.member?.email ||
                      "—";

                  return (
                    <tr
                      key={item._id}
                      className="border-b border-white/5 last:border-0"
                    >

                      {/* PERSON */}

                      <td className="px-6 py-4">

                        <div className="flex items-center gap-3">

                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                              isGuest
                                ? "bg-purple-500/10 text-purple-300"
                                : "bg-[#b9d63b]/10 text-[#b9d63b]"
                            }`}
                          >
                            {personName
                              ?.charAt(0)
                              ?.toUpperCase() ||
                              "?"}
                          </div>

                          <div>

                            <p className="text-sm font-medium text-white">
                              {personName}
                            </p>

                            <p className="text-xs text-white/30">
                              {personMobile}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* TYPE */}

                      <td className="px-6 py-4">

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                            isGuest
                              ? "bg-purple-500/10 text-purple-300"
                              : "bg-[#b9d63b]/10 text-[#b9d63b]"
                          }`}
                        >

                          {isGuest ? (
                            <Ticket size={12} />
                          ) : (
                            <UserCheck size={12} />
                          )}

                          {isGuest
                            ? "Guest Pass"
                            : "Member"}

                        </span>

                      </td>

                      {/* EVENT / HOST */}

                      <td className="px-6 py-4">

                        {isGuest ? (
                          <div>

                            <p className="text-sm text-white">
                              Host
                            </p>

                            <p className="text-xs text-white/35">
                              {item.member?.name ||
                                "Unknown Member"}
                            </p>

                            {item.guestPassCode && (
                              <p className="mt-1 text-[11px] text-purple-300/70">
                                {item.guestPassCode}
                              </p>
                            )}

                          </div>
                        ) : (
                          <div>

                            <p className="text-sm text-white">
                              {item.event?.name ||
                                "Event Attendance"}
                            </p>

                            {item.event?.location && (
                              <div className="mt-1 flex items-center gap-1 text-xs text-white/30">
                                <MapPin size={11} />

                                {item.event.location}
                              </div>
                            )}

                          </div>
                        )}

                      </td>

                      {/* STATUS */}

                      <td className="px-6 py-4">

                        <span className="rounded-full bg-[#b9d63b]/10 px-2.5 py-1 text-xs font-medium text-[#b9d63b]">
                          {item.status}
                        </span>

                      </td>

                      {/* DATE */}

                      <td className="px-6 py-4">

                        <div>

                          <p className="text-sm text-white/70">
                            {formatDateTime(
                              item.checkedInAt
                            )}
                          </p>

                        </div>

                      </td>

                      {/* ACTION */}

                      <td className="px-6 py-4 text-right">

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedAttendance(
                              item
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs font-medium text-white/60 transition hover:bg-white/10 hover:text-white"
                        >
                          <Eye size={14} />

                          View
                        </button>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

        {/* ====================================
            PAGINATION
        ==================================== */}

        {!loading &&
          pagination.totalPages > 0 && (
            <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">

              <p className="text-sm text-white/35">

                Page{" "}

                <span className="text-white/70">
                  {pagination.page}
                </span>{" "}

                of{" "}

                <span className="text-white/70">
                  {pagination.totalPages}
                </span>

              </p>

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() =>
                    setPage(
                      (value) => value - 1
                    )
                  }
                  className="rounded-lg border border-white/10 p-2 text-white/50 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft size={17} />
                </button>

                <button
                  type="button"
                  disabled={
                    page >=
                    pagination.totalPages
                  }
                  onClick={() =>
                    setPage(
                      (value) => value + 1
                    )
                  }
                  className="rounded-lg border border-white/10 p-2 text-white/50 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronRight size={17} />
                </button>

              </div>

            </div>
          )}

      </section>

      {/* ======================================
          DETAILS MODAL
      ====================================== */}

      {selectedAttendance && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedAttendance(null);
            }
          }}
        >

          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#17111f] shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">

              <div>

                <h2 className="text-lg font-semibold text-white">
                  Attendance Details
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  Check-in information
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedAttendance(null)
                }
                className="rounded-lg p-2 text-white/40 transition hover:bg-white/5 hover:text-white"
              >
                <X size={20} />
              </button>

            </div>

            {/* BODY */}

            <div className="space-y-5 p-6">

              {/* TYPE */}

              <DetailRow
                label="Type"
                value={
                  selectedAttendance.type ===
                  "GUEST_PASS"
                    ? "Guest Pass"
                    : "Member"
                }
              />

              {/* PERSON */}

              <DetailRow
                label={
                  selectedAttendance.type ===
                  "GUEST_PASS"
                    ? "Guest"
                    : "Member"
                }
                value={
                  selectedAttendance.type ===
                  "GUEST_PASS"
                    ? selectedAttendance
                        .guest?.name ||
                      "Unknown"
                    : selectedAttendance
                        .member?.name ||
                      "Unknown"
                }
              />

              <DetailRow
                label="Mobile"
                value={
                  selectedAttendance.type ===
                  "GUEST_PASS"
                    ? selectedAttendance
                        .guest?.mobile ||
                      "—"
                    : selectedAttendance
                        .member?.mobile ||
                      "—"
                }
              />

              <DetailRow
                label="Status"
                value={
                  selectedAttendance.status
                }
              />

              {/* MEMBER EVENT */}

              {selectedAttendance.type !==
                "GUEST_PASS" &&
                selectedAttendance.event && (
                  <div className="border-t border-white/10 pt-5">

                    <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/30">
                      Event Details
                    </p>

                    <div className="space-y-4">

                      <DetailRow
                        label="Event"
                        value={
                          selectedAttendance
                            .event.name
                        }
                      />

                      <DetailRow
                        label="Location"
                        value={
                          selectedAttendance
                            .event.location
                        }
                      />

                      {selectedAttendance
                        .event.date && (
                        <DetailRow
                          label="Date"
                          value={formatEventDate(
                            selectedAttendance
                              .event.date
                          )}
                        />
                      )}

                      {selectedAttendance
                        .event.startTime && (
                        <DetailRow
                          label="Time"
                          value={`${formatTime(
                            selectedAttendance
                              .event.startTime
                          )}${
                            selectedAttendance
                              .event.endTime
                              ? ` - ${formatTime(
                                  selectedAttendance
                                    .event.endTime
                                )}`
                              : ""
                          }`}
                        />
                      )}

                    </div>

                  </div>
                )}

              {/* GUEST */}

              {selectedAttendance.type ===
                "GUEST_PASS" && (
                <div className="border-t border-white/10 pt-5">

                  <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/30">
                    Guest Pass Details
                  </p>

                  <div className="space-y-4">

                    <DetailRow
                      label="Host Member"
                      value={
                        selectedAttendance
                          .member?.name ||
                        "Unknown"
                      }
                    />

                    <DetailRow
                      label="Host Mobile"
                      value={
                        selectedAttendance
                          .member?.mobile ||
                        "—"
                      }
                    />

                    <DetailRow
                      label="Guest Pass"
                      value={
                        selectedAttendance
                          .guestPassCode ||
                        "—"
                      }
                    />

                  </div>

                </div>
              )}

              {/* CHECK-IN */}

              <div className="border-t border-white/10 pt-5">

                <DetailRow
                  label="Checked In"
                  value={formatDateTime(
                    selectedAttendance
                      .checkedInAt
                  )}
                />

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

/*
 * =============================================
 * STAT CARD
 * =============================================
 */

function StatCard({
  icon: Icon,
  title,
  value,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-white/40">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {value}
          </p>

        </div>

        <div className="rounded-xl bg-[#b9d63b]/10 p-3">

          <Icon
            size={20}
            className="text-[#b9d63b]"
          />

        </div>

      </div>

    </div>
  );
}

/*
 * =============================================
 * DETAIL ROW
 * =============================================
 */

function DetailRow({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between gap-6">

      <span className="text-sm text-white/35">
        {label}
      </span>

      <span className="text-right text-sm font-medium text-white">
        {value || "—"}
      </span>

    </div>
  );
}

/*
 * =============================================
 * DATE TIME
 * =============================================
 */

function formatDateTime(date) {
  if (!date) {
    return "—";
  }

  const parsed = new Date(date);

  if (
    Number.isNaN(parsed.getTime())
  ) {
    return "—";
  }

  return parsed.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

/*
 * =============================================
 * EVENT DATE
 * =============================================
 */

function formatEventDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (
    Number.isNaN(parsed.getTime())
  ) {
    return "—";
  }

  return parsed.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

/*
 * =============================================
 * EVENT TIME
 * =============================================
 */

function formatTime(time) {
  if (!time) return "";

  const [hours, minutes] =
    time.split(":");

  const date = new Date();

  date.setHours(
    Number(hours),
    Number(minutes),
    0,
    0
  );

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }
  );
}
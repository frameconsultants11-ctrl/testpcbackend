"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  MapPin,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";

const STATUS_OPTIONS = [
  "ALL",
  "DRAFT",
  "PUBLISHED",
  "CANCELLED",
  "COMPLETED",
];

const statusStyles = {
  DRAFT: "bg-white/10 text-white/70",
  PUBLISHED: "bg-[#b9d63b]/15 text-[#b9d63b]",
  CANCELLED: "bg-red-500/15 text-red-400",
  COMPLETED: "bg-blue-500/15 text-blue-400",
};

export default function EventsClient() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });

  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    capacity: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchEvents() {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(page),
        limit: "12",
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (status !== "ALL") {
        params.set("status", status);
      }

      const response = await fetch(
        `/api/admin/events?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch events.");
      }

      setEvents(data.events || []);

      setPagination(
        data.pagination || {
          page: 1,
          limit: 12,
          total: 0,
          totalPages: 1,
        }
      );
    } catch (err) {
      console.error(err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, [page, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchEvents();
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  function updateForm(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function createEvent(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const response = await fetch("/api/admin/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          location: form.location,
          capacity: Number(form.capacity),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create event."
        );
      }

      setShowCreate(false);

      setForm({
        name: "",
        description: "",
        date: "",
        startTime: "",
        endTime: "",
        location: "",
        capacity: "",
      });

      setPage(1);
      await fetchEvents();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(time) {
    if (!time) return "";

    const [hours, minutes] = time.split(":");

    const date = new Date();

    date.setHours(Number(hours), Number(minutes), 0, 0);

    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white font-sans">
      <div className="mx-auto max-w-[1600px] p-4 md:p-6 lg:p-8">

        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold md:text-3xl">
              Events
            </h1>

            <p className="mt-1 text-sm text-white/45">
              Create and manage Purple community experiences.
            </p>
          </div>

          <button
            onClick={() => {
              setError("");
              setShowCreate(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#b9d63b] px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110"
          >
            <Plus size={18} />
            Create Event
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-col gap-3 lg:flex-row">

            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events or locations..."
                className="h-11 w-full rounded-xl border border-white/10 bg-black/30 pl-11 pr-4 text-sm outline-none placeholder:text-white/25 focus:border-[#b9d63b]/50"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {STATUS_OPTIONS.map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setStatus(item);
                    setPage(1);
                  }}
                  className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-medium transition ${
                    status === item
                      ? "bg-[#b9d63b] text-black"
                      : "bg-white/5 text-white/55 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Events */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
            <CalendarDays
              size={40}
              className="mx-auto text-white/20"
            />

            <h3 className="mt-4 text-lg font-medium">
              No events found
            </h3>

            <p className="mt-1 text-sm text-white/40">
              Create your first Purple experience.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => {
              const registeredCount =
                event.registeredCount || 0;

              const available = Math.max(
                (event.capacity || 0) - registeredCount,
                0
              );

              return (
                <div
                  key={event._id}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-[#b9d63b]/30"
                >
                  <div className="p-5">

                    <div className="mb-4 flex items-start justify-between gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                          statusStyles[event.status] ||
                          statusStyles.DRAFT
                        }`}
                      >
                        {event.status}
                      </span>

                      <Link
                        href={`/dashboard/events/${event._id}/edit`}
                        className="rounded-lg p-2 text-white/40 transition hover:bg-white/10 hover:text-white"
                      >
                        <Edit size={16} />
                      </Link>
                    </div>

                    <h2 className="line-clamp-2 text-lg font-semibold">
                      {event.name}
                    </h2>

                    {event.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/45">
                        {event.description}
                      </p>
                    )}

                    <div className="mt-5 space-y-3">

                      <div className="flex items-center gap-3 text-sm text-white/55">
                        <CalendarDays
                          size={16}
                          className="shrink-0 text-[#b9d63b]"
                        />

                        {formatDate(event.date)}
                      </div>

                      <div className="flex items-center gap-3 text-sm text-white/55">
                        <Clock
                          size={16}
                          className="shrink-0 text-[#b9d63b]"
                        />

                        {formatTime(event.startTime)}
                        {" - "}
                        {formatTime(event.endTime)}
                      </div>

                      <div className="flex items-center gap-3 text-sm text-white/55">
                        <MapPin
                          size={16}
                          className="shrink-0 text-[#b9d63b]"
                        />

                        <span className="truncate">
                          {event.location}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-white/55">
                        <Users
                          size={16}
                          className="shrink-0 text-[#b9d63b]"
                        />

                        <span>
                          {registeredCount} registered
                          {" · "}
                          {available} available
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 flex gap-2">
                      <Link
                        href={`/dashboard/events/${event._id}`}
                        className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-center text-xs font-medium text-white/65 transition hover:bg-white/5 hover:text-white"
                      >
                        View
                      </Link>

                      <Link
                        href={`/dashboard/events/${event._id}/registrations`}
                        className="flex-1 rounded-xl bg-white/5 px-4 py-2.5 text-center text-xs font-medium text-white/65 transition hover:bg-white/10 hover:text-white"
                      >
                        Registrations
                      </Link>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">

            <p className="text-xs text-white/40">
              Page {pagination.page} of{" "}
              {pagination.totalPages}
            </p>

            <div className="flex gap-2">

              <button
                disabled={page <= 1}
                onClick={() =>
                  setPage((current) => current - 1)
                }
                className="rounded-lg border border-white/10 p-2 text-white/60 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft size={17} />
              </button>

              <button
                disabled={page >= pagination.totalPages}
                onClick={() =>
                  setPage((current) => current + 1)
                }
                className="rounded-lg border border-white/10 p-2 text-white/60 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight size={17} />
              </button>

            </div>
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#111111]">

            <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-[#111111] px-5 py-4">

              <div>
                <h2 className="font-semibold">
                  Create Event
                </h2>

                <p className="mt-1 text-xs text-white/40">
                  Create a new Purple experience.
                </p>
              </div>

              <button
                onClick={() => setShowCreate(false)}
                className="rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white"
              >
                <X size={18} />
              </button>

            </div>

            <form
              onSubmit={createEvent}
              className="space-y-5 p-5"
            >

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <Field
                label="Event Name"
                value={form.name}
                onChange={(value) =>
                  updateForm("name", value)
                }
                placeholder="Sunday Purple Experience"
                required
              />

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(e) =>
                    updateForm(
                      "description",
                      e.target.value
                    )
                  }
                  rows={4}
                  placeholder="Describe the experience..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-white/25 focus:border-[#b9d63b]/50"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">

                <Field
                  label="Date"
                  type="date"
                  value={form.date}
                  onChange={(value) =>
                    updateForm("date", value)
                  }
                  required
                />

                <Field
                  label="Capacity"
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(value) =>
                    updateForm("capacity", value)
                  }
                  placeholder="50"
                  required
                />

                <Field
                  label="Start Time"
                  type="time"
                  value={form.startTime}
                  onChange={(value) =>
                    updateForm("startTime", value)
                  }
                  required
                />

                <Field
                  label="End Time"
                  type="time"
                  value={form.endTime}
                  onChange={(value) =>
                    updateForm("endTime", value)
                  }
                  required
                />

              </div>

              <Field
                label="Location"
                value={form.location}
                onChange={(value) =>
                  updateForm("location", value)
                }
                placeholder="Purple Studio, Jaipur"
                required
              />

              <div className="flex justify-end gap-3 border-t border-white/10 pt-5">

                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm text-white/60 hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#b9d63b] px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Event"}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  min,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-white/60">
        {label}
      </label>

      <input
        type={type}
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm outline-none placeholder:text-white/25 focus:border-[#b9d63b]/50"
      />
    </div>
  );
}
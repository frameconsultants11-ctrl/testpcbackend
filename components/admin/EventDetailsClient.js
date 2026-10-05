"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Edit,
  MapPin,
  Users,
  XCircle,
} from "lucide-react";

const statusStyles = {
  DRAFT: "bg-white/10 text-white/70",
  PUBLISHED:
    "bg-[#b9d63b]/15 text-[#b9d63b]",
  CANCELLED:
    "bg-red-500/15 text-red-400",
  COMPLETED:
    "bg-blue-500/15 text-blue-400",
};

export default function EventDetailsClient({
  eventId,
}) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cancelling, setCancelling] = useState(false);

  async function fetchEvent() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/events/${eventId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch event."
        );
      }

      setEvent(data.event);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  async function cancelEvent() {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this event?"
    );

    if (!confirmed) return;

    try {
      setCancelling(true);
      setError("");

      const response = await fetch(
        `/api/admin/events/${eventId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to cancel event."
        );
      }

      await fetchEvent();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setCancelling(false);
    }
  }

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  }

  function formatTime(time) {
    if (!time) return "";

    const [hours, minutes] = time.split(":");

    const date = new Date();

    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] p-4 text-white md:p-6 lg:p-8">
        <div className="mx-auto max-w-[1200px]">

          <div className="h-5 w-32 animate-pulse rounded bg-white/10" />

          <div className="mt-6 h-52 animate-pulse rounded-2xl bg-white/[0.03]" />

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-2xl bg-white/[0.03]"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-[#080808] p-6 text-white">
        <div className="mx-auto max-w-4xl rounded-2xl border border-red-500/20 bg-red-500/5 p-10 text-center">

          <XCircle
            size={40}
            className="mx-auto text-red-400"
          />

          <h1 className="mt-4 text-xl font-semibold">
            Unable to load event
          </h1>

          <p className="mt-2 text-sm text-white/40">
            {error}
          </p>

          <Link
            href="/dashboard/events"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#b9d63b] px-5 py-3 text-sm font-semibold text-black"
          >
            <ArrowLeft size={16} />
            Back to Events
          </Link>

        </div>
      </div>
    );
  }

  const percentage =
    event.capacity > 0
      ? Math.min(
          Math.round(
            (event.registeredCount /
              event.capacity) *
              100
          ),
          100
        )
      : 0;

  return (
    <div className="min-h-screen  text-white font-sans">
      <div className=" p-4 md:p-6 lg:p-8">

        {/* Top */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          

          <div className="flex gap-2">

            <Link
              href={`/dashboard/events/${eventId}/registrations`}
              className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-xs font-medium text-white/65 transition hover:bg-white/10 hover:text-white"
            >
              <Users size={16} />
              Registrations
            </Link>

            <Link
              href={`/dashboard/events/${eventId}/edit`}
              className="inline-flex items-center gap-2 rounded-xl bg-[#b9d63b] px-4 py-2.5 text-xs font-semibold text-black transition hover:brightness-110"
            >
              <Edit size={16} />
              Edit
            </Link>

          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Main Card */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">

          <div className="border-b border-white/10 p-6 md:p-8">

            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

              <div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium ${
                    statusStyles[event.status] ||
                    statusStyles.DRAFT
                  }`}
                >
                  {event.status}
                </span>

                <h1 className="mt-4 text-2xl font-semibold md:text-3xl">
                  {event.name}
                </h1>

                {event.description && (
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-white/45">
                    {event.description}
                  </p>
                )}
              </div>

              {event.status !== "CANCELLED" &&
                event.status !== "COMPLETED" && (
                  <button
                    onClick={cancelEvent}
                    disabled={cancelling}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-xs font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                  >
                    <XCircle size={16} />
                    {cancelling
                      ? "Cancelling..."
                      : "Cancel Event"}
                  </button>
                )}
            </div>

            {/* Event info */}
            <div className="mt-8 grid gap-4 md:grid-cols-3">

              <InfoItem
                icon={<CalendarDays size={18} />}
                label="Date"
                value={formatDate(event.date)}
              />

              <InfoItem
                icon={<Clock size={18} />}
                label="Time"
                value={`${formatTime(
                  event.startTime
                )} - ${formatTime(
                  event.endTime
                )}`}
              />

              <InfoItem
                icon={<MapPin size={18} />}
                label="Location"
                value={event.location}
              />

            </div>
          </div>

          {/* Statistics */}
          <div className="grid divide-y divide-white/10 md:grid-cols-3 md:divide-x md:divide-y-0">

            <Stat
              label="Registered"
              value={event.registeredCount}
              icon={<Users size={18} />}
            />

            <Stat
              label="Attended"
              value={event.attendedCount}
              icon={<CheckCircle2 size={18} />}
            />

            <Stat
              label="Available"
              value={event.availableCount}
              icon={<Users size={18} />}
            />

          </div>
        </div>

        {/* Capacity */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6">

          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium">
                Event Capacity
              </h2>

              <p className="mt-1 text-xs text-white/35">
                {event.registeredCount} of{" "}
                {event.capacity} seats registered
              </p>
            </div>

            <span className="text-lg font-semibold text-[#b9d63b]">
              {percentage}%
            </span>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#b9d63b] transition-all"
              style={{
                width: `${percentage}%`,
              }}
            />
          </div>

          <div className="mt-4 flex justify-between text-xs text-white/30">
            <span>
              {event.registeredCount} registered
            </span>

            <span>
              {event.availableCount} available
            </span>
          </div>

        </div>

        {/* Quick Actions */}
        <div className="mt-5 grid gap-4 md:grid-cols-2">

          <Link
            href={`/dashboard/events/${eventId}/registrations`}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#b9d63b]/30"
          >
            <Users
              size={22}
              className="text-[#b9d63b]"
            />

            <h3 className="mt-4 font-medium">
              Manage Registrations
            </h3>

            <p className="mt-1 text-sm text-white/35">
              View registered members and manage event check-ins.
            </p>
          </Link>

          <Link
            href={`/dashboard/events/${eventId}/edit`}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#b9d63b]/30"
          >
            <Edit
              size={22}
              className="text-[#b9d63b]"
            />

            <h3 className="mt-4 font-medium">
              Edit Event
            </h3>

            <p className="mt-1 text-sm text-white/35">
              Update event details, capacity, timing and status.
            </p>
          </Link>

        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">

      <div className="flex items-center gap-2 text-xs text-white/35">
        <span className="text-[#b9d63b]">
          {icon}
        </span>

        {label}
      </div>

      <p className="mt-2 text-sm text-white/75">
        {value || "-"}
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}) {
  return (
    <div className="p-6">

      <div className="flex items-center gap-2 text-xs text-white/35">
        <span className="text-[#b9d63b]">
          {icon}
        </span>

        {label}
      </div>

      <p className="mt-3 text-3xl font-semibold">
        {value ?? 0}
      </p>

    </div>
  );
}
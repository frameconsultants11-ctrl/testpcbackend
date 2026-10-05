"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
} from "lucide-react";

const STATUS_OPTIONS = [
  "DRAFT",
  "PUBLISHED",
  "CANCELLED",
  "COMPLETED",
];

export default function EventEditClient({
  eventId,
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    capacity: "",
    status: "DRAFT",
  });

  const [registeredCount, setRegisteredCount] =
    useState(0);

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

      const event = data.event;

      setForm({
        name: event.name || "",
        description: event.description || "",
        date: formatDateInput(event.date),
        startTime: event.startTime || "",
        endTime: event.endTime || "",
        location: event.location || "",
        capacity: String(event.capacity || ""),
        status: event.status || "DRAFT",
      });

      setRegisteredCount(
        event.registeredCount || 0
      );
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

  function updateForm(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setSuccess("");
    setError("");
  }

  async function saveEvent(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const capacity = Number(form.capacity);

      if (!form.name.trim()) {
        throw new Error(
          "Event name is required."
        );
      }

      if (!form.date) {
        throw new Error(
          "Event date is required."
        );
      }

      if (!form.startTime) {
        throw new Error(
          "Start time is required."
        );
      }

      if (!form.endTime) {
        throw new Error(
          "End time is required."
        );
      }

      if (!form.location.trim()) {
        throw new Error(
          "Location is required."
        );
      }

      if (!Number.isInteger(capacity) || capacity < 1) {
        throw new Error(
          "Capacity must be a positive number."
        );
      }

      if (capacity < registeredCount) {
        throw new Error(
          `Capacity cannot be less than ${registeredCount} current registrations.`
        );
      }

      const response = await fetch(
        `/api/admin/events/${eventId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            description: form.description.trim(),
            date: form.date,
            startTime: form.startTime,
            endTime: form.endTime,
            location: form.location.trim(),
            capacity,
            status: form.status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update event."
        );
      }

      setSuccess(
        "Event updated successfully."
      );

      if (data.event) {
        setRegisteredCount(
          data.event.registeredCount ??
            registeredCount
        );
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] p-4 text-white md:p-6 lg:p-8">
        <div className="mx-auto max-w-3xl">

          <div className="h-5 w-32 animate-pulse rounded bg-white/10" />

          <div className="mt-6 h-[650px] animate-pulse rounded-2xl bg-white/[0.03]" />

        </div>
      </div>
    );
  }

  if (error && !form.name) {
    return (
      <div className="min-h-screen bg-[#080808] p-6 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-500/20 bg-red-500/5 p-10 text-center">

          <h1 className="text-xl font-semibold">
            Unable to load event
          </h1>

          <p className="mt-2 text-sm text-white/40">
            {error}
          </p>

          <Link
            href="/admin/events"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#b9d63b] px-5 py-3 text-sm font-semibold text-black"
          >
            <ArrowLeft size={16} />
            Back to Events
          </Link>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  text-white font-sans">
      <div className=" p-4 md:p-6 lg:p-8">

        <div className="mb-6 flex items-center justify-between">

          <Link
            href={`/dashboard/events/${eventId}`}
            className="inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Event
          </Link>

          <Link
            href={`/admin/events/${eventId}/registrations`}
            className="text-xs text-white/40 hover:text-white"
          >
            View Registrations
          </Link>

        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold md:text-3xl">
            Edit Event
          </h1>

          <p className="mt-1 text-sm text-white/40">
            Update your Purple community experience.
          </p>
        </div>

        <form
          onSubmit={saveEvent}
          className="rounded-2xl border border-white/10 bg-white/[0.03]"
        >

          <div className="space-y-5 p-5 md:p-6">

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-[#b9d63b]/20 bg-[#b9d63b]/10 px-4 py-3 text-sm text-[#b9d63b]">
                {success}
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
                rows={5}
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
                  updateForm(
                    "capacity",
                    value
                  )
                }
                required
              />

              <Field
                label="Start Time"
                type="time"
                value={form.startTime}
                onChange={(value) =>
                  updateForm(
                    "startTime",
                    value
                  )
                }
                required
              />

              <Field
                label="End Time"
                type="time"
                value={form.endTime}
                onChange={(value) =>
                  updateForm(
                    "endTime",
                    value
                  )
                }
                required
              />

            </div>

            <Field
              label="Location"
              value={form.location}
              onChange={(value) =>
                updateForm(
                  "location",
                  value
                )
              }
              placeholder="Purple Studio, Jaipur"
              required
            />

            <div>
              <label className="mb-2 block text-sm text-white/60">
                Status
              </label>

              <select
                value={form.status}
                onChange={(e) =>
                  updateForm(
                    "status",
                    e.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none focus:border-[#b9d63b]/50"
              >
                {STATUS_OPTIONS.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                      className="bg-[#111111]"
                    >
                      {status}
                    </option>
                  )
                )}
              </select>
            </div>

            {registeredCount > 0 && (
              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-xs text-white/35">
                  Current registrations
                </p>

                <p className="mt-1 text-sm font-medium">
                  {registeredCount}
                </p>

                <p className="mt-1 text-xs text-white/25">
                  Capacity cannot be reduced below this number.
                </p>
              </div>
            )}

          </div>

          <div className="flex justify-end gap-3 border-t border-white/10 p-5 md:p-6">

            <Link
              href={`/admin/events/${eventId}`}
              className="rounded-xl border border-white/10 px-5 py-3 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#b9d63b] px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={16} />

              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>

          </div>
        </form>
      </div>
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
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        required={required}
        className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm outline-none placeholder:text-white/25 focus:border-[#b9d63b]/50"
      />
    </div>
  );
}

function formatDateInput(date) {
  if (!date) return "";

  if (
    typeof date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    return date;
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(
    parsed.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    parsed.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
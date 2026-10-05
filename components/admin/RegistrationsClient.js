"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  QrCode,
  Search,
  UserCheck,
  Users,
  X,
} from "lucide-react";

const STATUS_OPTIONS = [
  "ALL",
  "REGISTERED",
  "ATTENDED",
];

export default function RegistrationsClient({ eventId }) {
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const [selectedRegistration, setSelectedRegistration] =
    useState(null);

  const [showScanner, setShowScanner] = useState(false);

  async function fetchRegistrations() {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (status !== "ALL") {
        params.set("status", status);
      }

      const response = await fetch(
        `/api/admin/events/${eventId}/registrations?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch registrations."
        );
      }

      setEvent(data.event || null);
      setRegistrations(data.registrations || []);

      setPagination(
        data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 1,
        }
      );
    } catch (error) {
      console.error(error);

      setEvent(null);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!eventId) return;

    fetchRegistrations();
  }, [eventId, page, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);

      if (eventId) {
        fetchRegistrations();
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatDateTime(date) {
    if (!date) return "-";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
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

  if (loading && !event) {
    return (
      <div className="min-h-screen bg-[#080808] p-4 text-white md:p-6 lg:p-8">
        <div className="mx-auto max-w-[1600px]">
          <div className="h-10 w-64 animate-pulse rounded-xl bg-white/10" />

          <div className="mt-6 h-40 animate-pulse rounded-2xl bg-white/[0.03]" />

          <div className="mt-6 h-96 animate-pulse rounded-2xl bg-white/[0.03]" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen font-sans p-6 text-white">
        <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
          <h1 className="text-xl font-semibold">
            Event not found
          </h1>

        </div>
      </div>
    );
  }

  const registeredCount = pagination.total;

  return (
    <div className="min-h-screen font-sans text-white">
      <div className="mx-auto max-w-[1600px] p-4 md:p-6 lg:p-8">

        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/admin/events/${eventId}`}
            className="mb-4 inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Event
          </Link>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold md:text-3xl">
                {event.name}
              </h1>

              <p className="mt-1 text-sm text-white/40">
                Event registrations and attendance
              </p>
            </div>

            <button
              onClick={() => setShowScanner(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#b9d63b] px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110"
            >
              <QrCode size={18} />
              Scan QR
            </button>
          </div>
        </div>

        {/* Event Information */}
        <div className="mb-6 grid gap-3 md:grid-cols-4">

          <InfoCard
            icon={<CalendarDays size={17} />}
            label="Date"
            value={formatDate(event.date)}
          />

          <InfoCard
            icon={<Clock size={17} />}
            label="Time"
            value={`${formatTime(event.startTime)} - ${formatTime(
              event.endTime
            )}`}
          />

          <InfoCard
            icon={<MapPin size={17} />}
            label="Location"
            value={event.location}
          />

          <InfoCard
            icon={<Users size={17} />}
            label="Capacity"
            value={`${registeredCount} / ${event.capacity}`}
          />

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
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search member, email, mobile or QR..."
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

        {/* Registrations */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">

          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="font-semibold">
                Registrations
              </h2>

              <p className="mt-1 text-xs text-white/35">
                {pagination.total} total registration
                {pagination.total === 1 ? "" : "s"}
              </p>
            </div>

            <div className="rounded-lg bg-white/5 px-3 py-2 text-xs text-white/50">
              Capacity: {event.capacity}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-xl bg-white/5"
                />
              ))}
            </div>
          ) : registrations.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Users
                size={40}
                className="mx-auto text-white/15"
              />

              <h3 className="mt-4 font-medium">
                No registrations found
              </h3>

              <p className="mt-1 text-sm text-white/35">
                No members match your current filters.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs text-white/35">
                      <th className="px-5 py-4 font-medium">
                        Member
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Mobile
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Registered
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Status
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Attendance
                      </th>

                      <th className="px-5 py-4 text-right font-medium">
                        QR
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {registrations.map(
                      (registration) => (
                        <RegistrationRow
                          key={registration._id}
                          registration={registration}
                          onQr={() =>
                            setSelectedRegistration(
                              registration
                            )
                          }
                        />
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="space-y-3 p-4 lg:hidden">
                {registrations.map(
                  (registration) => (
                    <MobileRegistrationCard
                      key={registration._id}
                      registration={registration}
                      onQr={() =>
                        setSelectedRegistration(
                          registration
                        )
                      }
                    />
                  )
                )}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {!loading &&
          pagination.totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">

              <p className="text-xs text-white/40">
                Page {pagination.page} of{" "}
                {pagination.totalPages}
              </p>

              <div className="flex gap-2">

                <button
                  disabled={page <= 1}
                  onClick={() =>
                    setPage(
                      (current) => current - 1
                    )
                  }
                  className="rounded-lg border border-white/10 p-2 text-white/60 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft size={17} />
                </button>

                <button
                  disabled={
                    page >=
                    pagination.totalPages
                  }
                  onClick={() =>
                    setPage(
                      (current) => current + 1
                    )
                  }
                  className="rounded-lg border border-white/10 p-2 text-white/60 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronRight size={17} />
                </button>

              </div>
            </div>
          )}

      </div>

      {/* QR Modal */}
      {selectedRegistration && (
        <QrModal
          registration={selectedRegistration}
          onClose={() =>
            setSelectedRegistration(null)
          }
        />
      )}

      {/* Scanner */}
      {showScanner && (
        <ScannerModal
          eventId={eventId}
          onClose={() => setShowScanner(false)}
          onSuccess={() => {
            setShowScanner(false);
            fetchRegistrations();
          }}
        />
      )}
    </div>
  );
}

/* -------------------------------- */
/* Info Card */
/* -------------------------------- */

function InfoCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-xs text-white/35">
        <span className="text-[#b9d63b]">
          {icon}
        </span>

        {label}
      </div>

      <p className="mt-2 truncate text-sm font-medium text-white/80">
        {value || "-"}
      </p>
    </div>
  );
}

/* -------------------------------- */
/* Desktop Row */
/* -------------------------------- */

function RegistrationRow({
  registration,
  onQr,
}) {
  const member = registration.member;

  return (
    <tr className="border-b border-white/5 transition hover:bg-white/[0.02]">

      <td className="px-5 py-4">
        <div>
          <p className="text-sm font-medium">
            {member?.name || "Unknown Member"}
          </p>

          <p className="mt-1 text-xs text-white/35">
            {member?.email || "-"}
          </p>
        </div>
      </td>

      <td className="px-5 py-4 text-sm text-white/55">
        {member?.mobile || "-"}
      </td>

      <td className="px-5 py-4">
        <p className="text-sm text-white/60">
          {formatDateTime(
            registration.registeredAt
          )}
        </p>
      </td>

      <td className="px-5 py-4">
        <StatusBadge
          status={registration.status}
        />
      </td>

      <td className="px-5 py-4">
        {registration.status === "ATTENDED" ? (
          <div className="flex items-center gap-2 text-xs text-[#b9d63b]">
            <CheckCircle2 size={15} />
            Checked in
          </div>
        ) : (
          <span className="text-xs text-white/30">
            Not checked in
          </span>
        )}
      </td>

      <td className="px-5 py-4 text-right">
        <button
          onClick={onQr}
          className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <QrCode size={15} />
          View QR
        </button>
      </td>

    </tr>
  );
}

/* -------------------------------- */
/* Mobile Card */
/* -------------------------------- */

function MobileRegistrationCard({
  registration,
  onQr,
}) {
  const member = registration.member;

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">

      <div className="flex items-start justify-between gap-3">

        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium">
            {member?.name || "Unknown Member"}
          </h3>

          <p className="mt-1 truncate text-xs text-white/35">
            {member?.email || "-"}
          </p>

          <p className="mt-1 text-xs text-white/40">
            {member?.mobile || "-"}
          </p>
        </div>

        <StatusBadge
          status={registration.status}
        />

      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">

        <div>
          <p className="text-[10px] uppercase tracking-wide text-white/25">
            Registered
          </p>

          <p className="mt-1 text-xs text-white/50">
            {formatDateTime(
              registration.registeredAt
            )}
          </p>
        </div>

        <button
          onClick={onQr}
          className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-white/60 hover:bg-white/10"
        >
          <QrCode size={15} />
          QR
        </button>

      </div>
    </div>
  );
}

/* -------------------------------- */
/* Status */
/* -------------------------------- */

function StatusBadge({ status }) {
  if (status === "ATTENDED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#b9d63b]/15 px-3 py-1 text-[11px] font-medium text-[#b9d63b]">
        <CheckCircle2 size={12} />
        ATTENDED
      </span>
    );
  }

  return (
    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-[11px] font-medium text-blue-400">
      REGISTERED
    </span>
  );
}

/* -------------------------------- */
/* QR Modal */
/* -------------------------------- */

function QrModal({
  registration,
  onClose,
}) {
  const [QRCode, setQRCode] = useState(null);

  useEffect(() => {
    let mounted = true;

    import("qrcode.react").then((module) => {
      if (mounted) {
        setQRCode(() => module.QRCodeSVG);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">

      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111111] p-6">

        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">
              Event QR Code
            </h2>

            <p className="mt-1 text-xs text-white/35">
              Scan this QR at the event.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="rounded-2xl bg-white p-6">
          <div className="flex aspect-square items-center justify-center">

            {QRCode ? (
              <QRCode
                value={registration.qrCode}
                size={260}
                level="H"
              />
            ) : (
              <div className="text-sm text-black/50">
                Loading QR...
              </div>
            )}

          </div>
        </div>

        <div className="mt-5 text-center">
          <p className="font-medium">
            {registration.member?.name ||
              "Unknown Member"}
          </p>

          <p className="mt-1 text-xs text-white/35">
            {registration.member?.mobile || "-"}
          </p>

          <div className="mt-4 rounded-xl bg-white/5 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-white/25">
              QR Code
            </p>

            <p className="mt-1 break-all font-mono text-xs text-white/55">
              {registration.qrCode}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

/* -------------------------------- */
/* Scanner */
/* -------------------------------- */

function ScannerModal({
  eventId,
  onClose,
  onSuccess,
}) {
  const [scannerReady, setScannerReady] =
    useState(false);

  const [manualCode, setManualCode] =
    useState("");

  const [checkingIn, setCheckingIn] =
    useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] =
    useState(null);

  async function checkIn(qrCode) {
    const code = qrCode?.trim();

    if (!code) {
      setError("QR code is required.");
      return;
    }

    try {
      setCheckingIn(true);
      setError("");

      const response = await fetch(
        `/api/admin/events/${eventId}/check-in`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            qrCode: code,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Check-in failed."
        );
      }

      setSuccess(data);

      setManualCode("");
    } catch (err) {
      setError(err.message);
    } finally {
      setCheckingIn(false);
    }
  }

  useEffect(() => {
    let scanner;

    async function startScanner() {
      try {
        const { Html5Qrcode } =
          await import("html5-qrcode");

        scanner = new Html5Qrcode(
          "event-qr-reader"
        );

        setScannerReady(true);

        await scanner.start(
          {
            facingMode: "environment",
          },
          {
            fps: 10,
            qrbox: {
              width: 250,
              height: 250,
            },
          },
          async (decodedText) => {
            if (!checkingIn) {
              await scanner.stop().catch(() => {});
              await checkIn(decodedText);
            }
          },
          () => {}
        );
      } catch (err) {
        console.error(
          "QR SCANNER ERROR:",
          err
        );

        setError(
          "Camera could not be started. Use the manual QR code field."
        );
      }
    }

    startScanner();

    return () => {
      if (scanner) {
        scanner
          .stop()
          .catch(() => {})
          .finally(() => {
            scanner.clear();
          });
      }
    };
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        onSuccess();
      }, 1800);

      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center  p-4 backdrop-blur-sm font-sans">

      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 ">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">

          <div>
            <h2 className="font-semibold">
              Event Check-In
            </h2>

            <p className="mt-1 text-xs text-white/35">
              Scan member event QR code
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white"
          >
            <X size={18} />
          </button>

        </div>

        <div className="space-y-5 p-5">

          {success ? (
            <div className="rounded-2xl border border-[#b9d63b]/20 bg-[#b9d63b]/10 p-8 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#b9d63b] text-black">
                <CheckCircle2 size={32} />
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                Check-In Successful
              </h3>

              <p className="mt-2 text-sm text-white/50">
                {success.member?.name}
              </p>

              <p className="mt-1 text-xs text-white/30">
                {success.member?.mobile}
              </p>

            </div>
          ) : (
            <>
              {/* Camera */}
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">

                <div
                  id="event-qr-reader"
                  className="min-h-[300px]"
                />

              </div>

              {scannerReady && !error && (
                <p className="text-center text-xs text-white/30">
                  Point the camera at the member's QR code.
                </p>
              )}

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Manual */}
              <div className="border-t border-white/10 pt-5">

                <p className="mb-3 text-xs font-medium text-white/50">
                  Or enter QR code manually
                </p>

                <div className="flex gap-2">

                  <input
                    value={manualCode}
                    onChange={(e) =>
                      setManualCode(
                        e.target.value
                      )
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter"
                      ) {
                        checkIn(manualCode);
                      }
                    }}
                    placeholder="ER-XXXXXXXX"
                    className="h-11 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 font-mono text-sm outline-none placeholder:text-white/20 focus:border-[#b9d63b]/50"
                  />

                  <button
                    onClick={() =>
                      checkIn(manualCode)
                    }
                    disabled={
                      checkingIn ||
                      !manualCode.trim()
                    }
                    className="rounded-xl bg-[#b9d63b] px-5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {checkingIn
                      ? "Checking..."
                      : "Check In"}
                  </button>

                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

/* -------------------------------- */
/* Helpers */
/* -------------------------------- */

function formatDateTime(date) {
  if (!date) return "-";

  return new Date(date).toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }
  );
}
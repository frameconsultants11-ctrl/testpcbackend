"use client";

import { useEffect, useRef, useState } from "react";

import {
  Search,
  RefreshCw,
  Ticket,
  CheckCircle2,
  Clock,
  User,
  Phone,
  Mail,
  QrCode,
  Printer,
  Download,
  X,
  ScanLine,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { QRCodeCanvas } from "qrcode.react";

export default function GuestPassesClient() {
  const [passes, setPasses] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("ALL");

  const [page, setPage] = useState(1);

  const [selectedPass, setSelectedPass] =
    useState(null);

  const [showQR, setShowQR] = useState(false);

  const [showCheckIn, setShowCheckIn] =
    useState(false);

  const [guestName, setGuestName] =
    useState("");

  const [guestMobile, setGuestMobile] =
    useState("");

  const [checkingIn, setCheckingIn] =
    useState(false);

  const [success, setSuccess] = useState("");

  const qrCanvasRef = useRef(null);

  const limit = 20;

  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });

  /*
   * ==========================================
   * FETCH PASSES
   * ==========================================
   */

  async function fetchPasses(
    currentPage = page,
    currentSearch = search,
    currentStatus = status
  ) {
    try {
      setLoading(true);

      setError("");

      const params = new URLSearchParams();

      params.set(
        "page",
        currentPage.toString()
      );

      params.set(
        "limit",
        limit.toString()
      );

      if (currentSearch.trim()) {
        params.set(
          "search",
          currentSearch.trim()
        );
      }

      if (currentStatus !== "ALL") {
        params.set(
          "status",
          currentStatus
        );
      }

      const response = await fetch(
        `/api/admin/guest-passes?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch guest passes."
        );
      }

      setPasses(
        data.passes || []
      );

      setPagination(
        data.pagination || {
          page: currentPage,
          limit,
          total: data.passes?.length || 0,
          totalPages: 1,
        }
      );
    } catch (error) {
      console.error(
        "FETCH GUEST PASSES ERROR:",
        error
      );

      setError(
        error.message ||
          "Failed to fetch guest passes."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * ==========================================
   * INITIAL LOAD
   * ==========================================
   */

  useEffect(() => {
    fetchPasses(
      1,
      "",
      "ALL"
    );
  }, []);

  /*
   * ==========================================
   * FILTER EFFECT
   * ==========================================
   */

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);

      fetchPasses(
        1,
        search,
        status
      );
    }, 400);

    return () =>
      clearTimeout(timeout);
  }, [search, status]);

  /*
   * ==========================================
   * OPEN QR
   * ==========================================
   */

  function openQR(pass) {
    setSelectedPass(pass);

    setShowQR(true);

    setSuccess("");

    setError("");
  }

  /*
   * ==========================================
   * CLOSE QR
   * ==========================================
   */

  function closeQR() {
    setShowQR(false);

    setSelectedPass(null);
  }

  /*
   * ==========================================
   * DOWNLOAD QR
   * ==========================================
   */

  function downloadQR() {
    if (!selectedPass) {
      return;
    }

    const canvas =
      document.getElementById(
        `guest-pass-qr-${selectedPass._id}`
      );

    if (!canvas) {
      setError(
        "QR image is not ready yet."
      );

      return;
    }

    const image =
      canvas.toDataURL(
        "image/png"
      );

    const link =
      document.createElement("a");

    link.href = image;

    link.download =
      `purple-guest-pass-${selectedPass.code}.png`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  }

  /*
   * ==========================================
   * PRINT QR
   * ==========================================
   */

  function printQR() {
    if (!selectedPass) {
      return;
    }

    const canvas =
      document.getElementById(
        `guest-pass-qr-${selectedPass._id}`
      );

    if (!canvas) {
      setError(
        "QR image is not ready yet."
      );

      return;
    }

    const image =
      canvas.toDataURL(
        "image/png"
      );

    const memberName =
      selectedPass.memberName ||
      "Purple Member";

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=600,height=700"
      );

    if (!printWindow) {
      setError(
        "Please allow pop-ups to print the QR."
      );

      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>

      <html>

        <head>

          <title>
            Purple Guest Pass
          </title>

          <style>

            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 40px;
              font-family: Arial, sans-serif;
              background: #ffffff;
              color: #111111;
              text-align: center;
            }

            .card {
              width: 420px;
              max-width: 100%;
              margin: 0 auto;
              padding: 36px;
              border: 1px solid #ddd;
              border-radius: 20px;
            }

            .brand {
              font-size: 28px;
              font-weight: 800;
              margin-bottom: 6px;
            }

            .subtitle {
              color: #666;
              font-size: 14px;
              margin-bottom: 30px;
            }

            .qr {
              width: 280px;
              height: 280px;
              margin: 0 auto 25px;
            }

            .member {
              font-size: 18px;
              font-weight: 700;
              margin-bottom: 8px;
            }

            .code {
              display: inline-block;
              padding: 8px 14px;
              background: #f2f2f2;
              border-radius: 8px;
              font-family: monospace;
              font-size: 14px;
              letter-spacing: 1px;
            }

            .instruction {
              margin-top: 22px;
              color: #777;
              font-size: 12px;
              line-height: 1.5;
            }

            @media print {
              body {
                padding: 20px;
              }

              .card {
                border: none;
              }
            }

          </style>

        </head>

        <body>

          <div class="card">

            <div class="brand">
              PURPLE
            </div>

            <div class="subtitle">
              Guest Pass
            </div>

            <img
              class="qr"
              src="${image}"
              alt="Purple Guest Pass QR"
            />

            <div class="member">
              ${escapeHtml(memberName)}
            </div>

            <div class="code">
              ${escapeHtml(selectedPass.code)}
            </div>

            <div class="instruction">
              Present this QR code at the Purple
              check-in counter.
            </div>

          </div>

          <script>
            window.onload = function () {
              window.print();

              setTimeout(function () {
                window.close();
              }, 500);
            };
          </script>

        </body>

      </html>
    `);

    printWindow.document.close();
  }

  /*
   * ==========================================
   * OPEN CHECK-IN
   * ==========================================
   */

  function openCheckIn(pass) {
    if (pass.status !== "AVAILABLE") {
      setError(
        "This guest pass has already been used."
      );

      return;
    }

    setSelectedPass(pass);

    setGuestName("");

    setGuestMobile("");

    setShowCheckIn(true);

    setError("");

    setSuccess("");
  }

  /*
   * ==========================================
   * CHECK-IN
   * ==========================================
   */

  async function handleCheckIn(event) {
    event.preventDefault();

    if (!selectedPass) {
      return;
    }

    const name =
      guestName.trim();

    const mobile =
      guestMobile.trim();

    if (!name) {
      setError(
        "Guest name is required."
      );

      return;
    }

    if (!/^[0-9]{10}$/.test(mobile)) {
      setError(
        "Enter a valid 10 digit mobile number."
      );

      return;
    }

    try {
      setCheckingIn(true);

      setError("");

      const response =
        await fetch(
          "/api/admin/guest-passes/redeem",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              code: selectedPass.code,

              guest: {
                name,

                mobile,
              },
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to check in guest."
        );
      }

      setShowCheckIn(false);

      setSelectedPass(null);

      setGuestName("");

      setGuestMobile("");

      setSuccess(
        "Guest checked in successfully."
      );

      await fetchPasses(
        page,
        search,
        status
      );

      setTimeout(() => {
        setSuccess("");
      }, 4000);
    } catch (error) {
      console.error(
        "CHECK-IN ERROR:",
        error
      );

      setError(
        error.message ||
          "Failed to check in guest."
      );
    } finally {
      setCheckingIn(false);
    }
  }

  /*
   * ==========================================
   * PAGINATION
   * ==========================================
   */

  function goToPage(nextPage) {
    if (
      nextPage < 1 ||
      nextPage >
        pagination.totalPages
    ) {
      return;
    }

    setPage(nextPage);

    fetchPasses(
      nextPage,
      search,
      status
    );
  }

  /*
   * ==========================================
   * STATS
   * ==========================================
   */

  const availableCount =
    passes.filter(
      (pass) =>
        pass.status ===
        "AVAILABLE"
    ).length;

  const usedCount =
    passes.filter(
      (pass) =>
        pass.status === "USED"
    ).length;

  /*
   * ==========================================
   * UI
   * ==========================================
   */

  return (
    <div className="space-y-6 font-sans">

      {/* ====================================== */}
      {/* HEADER */}
      {/* ====================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

        <div>

          <p className="text-sm text-white/40">
            Admin Management
          </p>

          <h1 className="mt-1 text-3xl font-bold text-white">
            Guest Passes
          </h1>

          <p className="mt-2 text-sm text-white/40">
            Manage guest passes and generate
            QR codes for check-in.
          </p>

        </div>

        <a
          href="/dashboard/scan"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#b9d63b] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#c8e64a]"
        >
          <ScanLine size={17} />

          Scan QR
        </a>

      </div>

      {/* ====================================== */}
      {/* SUCCESS */}
      {/* ====================================== */}

      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-[#b9d63b]/20 bg-[#b9d63b]/10 px-4 py-3 text-sm text-[#b9d63b]">

          <CheckCircle2 size={18} />

          {success}

        </div>
      )}

      {/* ====================================== */}
      {/* ERROR */}
      {/* ====================================== */}

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">

          <AlertCircle size={18} />

          {error}

        </div>
      )}

      {/* ====================================== */}
      {/* STATS */}
      {/* ====================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <StatCard
          icon={Ticket}
          title="Total Passes"
          value={
            pagination.total
          }
        />

        <StatCard
          icon={Clock}
          title="Available"
          value={availableCount}
        />

        <StatCard
          icon={CheckCircle2}
          title="Used"
          value={usedCount}
        />

      </div>

      {/* ====================================== */}
      {/* FILTERS */}
      {/* ====================================== */}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">

        <div className="flex flex-col gap-3 md:flex-row">

          <div className="relative flex-1">

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search member, email, mobile or pass code..."
              className="h-12 w-full rounded-xl border border-white/10 bg-[#0d0913] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#b9d63b]/50"
            />

          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value
              )
            }
            className="h-12 rounded-xl border border-white/10 bg-[#0d0913] px-4 text-sm text-white outline-none focus:border-[#b9d63b]/50"
          >
            <option value="ALL">
              All Passes
            </option>

            <option value="AVAILABLE">
              Available
            </option>

            <option value="USED">
              Used
            </option>
          </select>

        </div>

      </section>

      {/* ====================================== */}
      {/* TABLE */}
      {/* ====================================== */}

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1050px]">

            <thead>

              <tr className="border-b border-white/10">

                <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-white/35">
                  Member
                </th>

                <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-white/35">
                  Pass Code
                </th>

                <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-white/35">
                  Type
                </th>

                <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-white/35">
                  Status
                </th>

                <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-white/35">
                  Created
                </th>

                <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wider text-white/35">
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (
                <LoadingRows />
              ) : passes.length === 0 ? (
                <tr>

                  <td
                    colSpan={6}
                    className="px-6 py-16 text-center"
                  >

                    <Ticket
                      size={38}
                      className="mx-auto text-white/10"
                    />

                    <p className="mt-4 text-sm font-medium text-white/50">
                      No guest passes found
                    </p>

                  </td>

                </tr>
              ) : (
                passes.map((pass) => (
                  <PassRow
                    key={pass._id}
                    pass={pass}
                    onViewQR={() =>
                      openQR(pass)
                    }
                    onCheckIn={() =>
                      openCheckIn(pass)
                    }
                  />
                ))
              )}

            </tbody>

          </table>

        </div>

        {/* ==================================== */}
        {/* PAGINATION */}
        {/* ==================================== */}

        {!loading &&
          pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">

              <p className="text-sm text-white/40">
                Page{" "}
                <span className="text-white">
                  {pagination.page}
                </span>{" "}
                of{" "}
                <span className="text-white">
                  {pagination.totalPages}
                </span>
              </p>

              <div className="flex gap-2">

                <button
                  type="button"
                  disabled={
                    pagination.page <=
                    1
                  }
                  onClick={() =>
                    goToPage(
                      pagination.page -
                        1
                    )
                  }
                  className="rounded-lg border border-white/10 p-2 text-white/50 transition hover:bg-white/5 hover:text-white disabled:opacity-30"
                >
                  <ChevronLeft
                    size={17}
                  />
                </button>

                <button
                  type="button"
                  disabled={
                    pagination.page >=
                    pagination.totalPages
                  }
                  onClick={() =>
                    goToPage(
                      pagination.page +
                        1
                    )
                  }
                  className="rounded-lg border border-white/10 p-2 text-white/50 transition hover:bg-white/5 hover:text-white disabled:opacity-30"
                >
                  <ChevronRight
                    size={17}
                  />
                </button>

              </div>

            </div>
          )}

      </section>

      {/* ====================================== */}
      {/* QR MODAL */}
      {/* ====================================== */}

      {showQR &&
        selectedPass && (
          <QRModal
            pass={selectedPass}
            onClose={closeQR}
            onDownload={downloadQR}
            onPrint={printQR}
          />
        )}

      {/* ====================================== */}
      {/* CHECK-IN MODAL */}
      {/* ====================================== */}

      {showCheckIn &&
        selectedPass && (
          <CheckInModal
            pass={selectedPass}
            guestName={guestName}
            guestMobile={guestMobile}
            setGuestName={setGuestName}
            setGuestMobile={setGuestMobile}
            checkingIn={checkingIn}
            onSubmit={handleCheckIn}
            onClose={() => {
              if (!checkingIn) {
                setShowCheckIn(false);
                setSelectedPass(null);
              }
            }}
          />
        )}

    </div>
  );
}

/*
 * =============================================
 * PASS ROW
 * =============================================
 */

function PassRow({
  pass,
  onViewQR,
  onCheckIn,
}) {
  const isAvailable =
    pass.status === "AVAILABLE";

  return (
    <tr className="border-b border-white/5 last:border-0">

      {/* MEMBER */}

      <td className="px-5 py-4">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#b9d63b]/10 text-sm font-bold text-[#b9d63b]">

            {pass.memberName
              ?.charAt(0)
              ?.toUpperCase() || "M"}

          </div>

          <div>

            <p className="text-sm font-medium text-white">
              {pass.memberName ||
                "Unknown Member"}
            </p>

            <p className="text-xs text-white/30">
              {pass.memberMobile ||
                pass.memberEmail ||
                "—"}
            </p>

          </div>

        </div>

      </td>

      {/* CODE */}

      <td className="px-5 py-4">

        <code className="rounded-lg bg-black/30 px-3 py-1.5 text-xs tracking-wide text-[#b9d63b]">
          {pass.code}
        </code>

      </td>

      {/* TYPE */}

      <td className="px-5 py-4">

        <span className="rounded-full bg-purple-500/10 px-2.5 py-1 text-xs font-medium text-purple-300">
          {pass.type}
        </span>

      </td>

      {/* STATUS */}

      <td className="px-5 py-4">

        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            isAvailable
              ? "bg-[#b9d63b]/10 text-[#b9d63b]"
              : "bg-white/5 text-white/40"
          }`}
        >

          {isAvailable ? (
            <Clock size={12} />
          ) : (
            <CheckCircle2
              size={12}
            />
          )}

          {pass.status}

        </span>

      </td>

      {/* CREATED */}

      <td className="px-5 py-4 text-sm text-white/50">
        {formatDate(pass.createdAt)}
      </td>

      {/* ACTION */}

      <td className="px-5 py-4">

        <div className="flex justify-end gap-2">

          <button
            type="button"
            onClick={onViewQR}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <QrCode size={14} />

            QR
          </button>

          {isAvailable && (
            <button
              type="button"
              onClick={onCheckIn}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#b9d63b] px-3 py-2 text-xs font-semibold text-black transition hover:bg-[#c8e64a]"
            >
              <CheckCircle2
                size={14}
              />

              Check In
            </button>
          )}

        </div>

      </td>

    </tr>
  );
}

/*
 * =============================================
 * QR MODAL
 * =============================================
 */

function QRModal({
  pass,
  onClose,
  onDownload,
  onPrint,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >

      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#17111f] shadow-2xl">

        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">

          <div>

            <h2 className="font-semibold text-white">
              Guest Pass QR
            </h2>

            <p className="mt-1 text-sm text-white/40">
              Scan this QR at check-in.
            </p>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/40 transition hover:bg-white/5 hover:text-white"
          >
            <X size={20} />
          </button>

        </div>

        {/* QR */}

        <div className="p-6">

          <div className="rounded-2xl bg-white p-6">

            <QRCodeCanvas
              id={`guest-pass-qr-${pass._id}`}
              value={pass.code}
              size={280}
              level="H"
              includeMargin
              bgColor="#ffffff"
              fgColor="#000000"
              className="mx-auto h-auto max-w-full"
            />

          </div>

          <div className="mt-5 text-center">

            <p className="font-semibold text-white">
              {pass.memberName ||
                "Purple Member"}
            </p>

            <p className="mt-1 text-xs text-white/40">
              Guest Pass
            </p>

            <code className="mt-3 inline-block rounded-lg bg-white/5 px-3 py-2 text-xs tracking-wider text-[#b9d63b]">
              {pass.code}
            </code>

          </div>

          {/* ACTIONS */}

          <div className="mt-6 grid grid-cols-2 gap-3">

            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <Download size={17} />

              Download
            </button>

            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#b9d63b] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#c8e64a]"
            >
              <Printer size={17} />

              Print
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

/*
 * =============================================
 * CHECK-IN MODAL
 * =============================================
 */

function CheckInModal({
  pass,
  guestName,
  guestMobile,
  setGuestName,
  setGuestMobile,
  checkingIn,
  onSubmit,
  onClose,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget &&
          !checkingIn
        ) {
          onClose();
        }
      }}
    >

      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#17111f] shadow-2xl">

        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">

          <div>

            <h2 className="font-semibold text-white">
              Check In Guest
            </h2>

            <p className="mt-1 text-sm text-white/40">
              Pass: {pass.code}
            </p>

          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={checkingIn}
            className="rounded-lg p-2 text-white/40 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
          >
            <X size={20} />
          </button>

        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-5 p-6"
        >

          {/* PASS */}

          <div className="rounded-xl border border-[#b9d63b]/10 bg-[#b9d63b]/5 p-4">

            <div className="flex items-center gap-3">

              <Ticket
                size={19}
                className="text-[#b9d63b]"
              />

              <div>

                <p className="text-xs text-white/35">
                  Guest Pass
                </p>

                <p className="mt-1 text-sm font-medium text-[#b9d63b]">
                  {pass.code}
                </p>

              </div>

            </div>

          </div>

          {/* NAME */}

          <div>

            <label className="mb-2 block text-sm font-medium text-white/70">
              Guest Name
            </label>

            <div className="relative">

              <User
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
              />

              <input
                value={guestName}
                onChange={(event) =>
                  setGuestName(
                    event.target.value
                  )
                }
                placeholder="Enter guest name"
                autoFocus
                className="h-12 w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#b9d63b]/40"
              />

            </div>

          </div>

          {/* MOBILE */}

          <div>

            <label className="mb-2 block text-sm font-medium text-white/70">
              Guest Mobile
            </label>

            <div className="relative">

              <Phone
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
              />

              <input
                value={guestMobile}
                onChange={(event) =>
                  setGuestMobile(
                    event.target.value
                      .replace(
                        /\D/g,
                        ""
                      )
                      .slice(0, 10)
                  )
                }
                placeholder="10 digit mobile number"
                inputMode="numeric"
                maxLength={10}
                className="h-12 w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#b9d63b]/40"
              />

            </div>

          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={
              checkingIn ||
              !guestName.trim() ||
              guestMobile.length !== 10
            }
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#b9d63b] px-5 text-sm font-semibold text-black transition hover:bg-[#c8e64a] disabled:cursor-not-allowed disabled:opacity-40"
          >

            {checkingIn ? (
              <>
                <RefreshCw
                  size={17}
                  className="animate-spin"
                />

                Checking In...
              </>
            ) : (
              <>
                <CheckCircle2
                  size={17}
                />

                Confirm Check-in
              </>
            )}

          </button>

        </form>

      </div>

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
 * LOADING ROWS
 * =============================================
 */

function LoadingRows() {
  return (
    <>
      {Array.from({
        length: 6,
      }).map((_, index) => (
        <tr key={index}>

          {Array.from({
            length: 6,
          }).map(
            (_, cellIndex) => (
              <td
                key={cellIndex}
                className="px-5 py-5"
              >
                <div className="h-4 w-24 animate-pulse rounded bg-white/5" />
              </td>
            )
          )}

        </tr>
      ))}
    </>
  );
}

/*
 * =============================================
 * DATE
 * =============================================
 */

function formatDate(date) {
  if (!date) {
    return "—";
  }

  const parsed =
    new Date(date);

  if (
    Number.isNaN(
      parsed.getTime()
    )
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
 * HTML ESCAPE
 * =============================================
 */

function escapeHtml(value) {
  return String(value || "")
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}
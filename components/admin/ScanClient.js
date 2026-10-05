"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Camera,
  CheckCircle2,
  RotateCcw,
  Search,
  Ticket,
  User,
  Phone,
  CalendarDays,
  MapPin,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";

import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";

const SCANNER_ID = "purple-qr-reader";

export default function ScanClient() {
  const scannerRef = useRef(null);

  const [scannerReady, setScannerReady] =
    useState(false);

  const [scanning, setScanning] =
    useState(false);

  const [code, setCode] =
    useState("");

  const [checking, setChecking] =
    useState(false);

  const [success, setSuccess] =
    useState("");

  const [error, setError] =
    useState("");

  const [manualCode, setManualCode] =
    useState("");

  const [result, setResult] =
    useState(null);

  /*
   * ==========================================
   * START SCANNER
   * ==========================================
   */

  async function startScanner() {
    try {
      setError("");
      setSuccess("");
      setResult(null);

      if (scannerRef.current) {
        return;
      }

      const scanner =
        new Html5Qrcode(SCANNER_ID);

      scannerRef.current = scanner;

      setScannerReady(true);

      await scanner.start(
        {
          facingMode: "environment",
        },
        {
          fps: 10,

          qrbox: {
            width: 280,
            height: 280,
          },

          aspectRatio: 1,

          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
          ],

          rememberLastUsedCamera: true,

          showTorchButtonIfSupported: true,
        },

        async (decodedText) => {
          await handleQRCode(decodedText);
        },

        () => {
          // Ignore continuous scanner errors.
        }
      );

      setScanning(true);
    } catch (error) {
      console.error(
        "QR SCANNER ERROR:",
        error
      );

      setScannerReady(false);
      setScanning(false);
      scannerRef.current = null;

      setError(
        getCameraErrorMessage(error)
      );
    }
  }

  /*
   * ==========================================
   * STOP SCANNER
   * ==========================================
   */

  async function stopScanner() {
    const scanner =
      scannerRef.current;

    if (!scanner) {
      return;
    }

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }

      await scanner.clear();
    } catch (error) {
      console.error(
        "STOP SCANNER ERROR:",
        error
      );
    } finally {
      scannerRef.current = null;

      setScanning(false);
      setScannerReady(false);
    }
  }

  /*
   * ==========================================
   * HANDLE QR
   * ==========================================
   */

  async function handleQRCode(decodedText) {
    if (!decodedText) {
      return;
    }

    const scannedCode =
      extractQRCode(decodedText);

    if (!scannedCode) {
      setError(
        "This QR code is not a valid Purple event or guest pass QR."
      );

      return;
    }

    setCode(scannedCode);
    setManualCode(scannedCode);

    setError("");
    setSuccess("");

    /*
     * Stop camera after successful detection.
     */
    await stopScanner();

    /*
     * Automatically process QR.
     */
    await checkInCode(scannedCode);
  }

  /*
   * ==========================================
   * MANUAL CODE
   * ==========================================
   */

  async function handleManualSearch(event) {
    event.preventDefault();

    const value =
      extractQRCode(manualCode);

    if (!value) {
      setError(
        "Enter a valid ER- or GP- QR code."
      );

      return;
    }

    setCode(value);
    setError("");
    setSuccess("");
    setResult(null);

    await checkInCode(value);
  }

  /*
   * ==========================================
   * CHECK IN
   * ==========================================
   */

  async function checkInCode(value) {
    if (!value) {
      setError(
        "Please scan or enter a QR code."
      );

      return;
    }

    try {
      setChecking(true);
      setError("");
      setSuccess("");
      setResult(null);

      const response =
        await fetch(
          "/api/admin/scan/check-in",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              code: value,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to process check-in."
        );
      }

      setResult(data.data || null);

      if (data.type === "EVENT") {
        setSuccess(
          "Member checked in successfully."
        );
      } else if (
        data.type === "GUEST_PASS"
      ) {
        setSuccess(
          "Guest checked in successfully."
        );
      } else {
        setSuccess(
          "Check-in completed successfully."
        );
      }

      setManualCode("");

    } catch (error) {
      console.error(
        "CHECK IN ERROR:",
        error
      );

      setError(
        error.message ||
          "Failed to process check-in."
      );
    } finally {
      setChecking(false);
    }
  }

  /*
   * ==========================================
   * RESET
   * ==========================================
   */

  async function resetScanner() {
    await stopScanner();

    setCode("");
    setManualCode("");
    setError("");
    setSuccess("");
    setResult(null);
  }

  /*
   * ==========================================
   * CLEANUP
   * ==========================================
   */

  useEffect(() => {
    return () => {
      const scanner =
        scannerRef.current;

      if (scanner) {
        if (scanner.isScanning) {
          scanner.stop().catch(() => {});
        }
      }

      scannerRef.current = null;
    };
  }, []);

  /*
   * ==========================================
   * RESULT HELPERS
   * ==========================================
   */

  const isGuestResult =
    result?.guestPassId ||
    code.startsWith("GP-");

  const isMemberResult =
    result?.registrationId ||
    code.startsWith("ER-");

  /*
   * ==========================================
   * UI
   * ==========================================
   */

  return (
    <div className="space-y-6 font-sans">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#b9d63b]/10">

              <Camera
                size={22}
                className="text-[#b9d63b]"
              />

            </div>

            <div>

              <h1 className="text-2xl font-bold text-white">
                Scan QR
              </h1>

              <p className="mt-1 text-sm text-white/40">
                Scan member or guest QR codes
                for event check-in.
              </p>

            </div>

          </div>
        </div>

        {(code ||
          error ||
          success ||
          result) && (

          <button
            type="button"
            onClick={resetScanner}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
          >
            <RotateCcw size={16} />
            Start Over
          </button>

        )}

      </div>

      {/* ======================================
          ALERTS
      ====================================== */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">

          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0 text-red-400"
          />

          <p className="text-sm text-red-300">
            {error}
          </p>

        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-[#b9d63b]/20 bg-[#b9d63b]/10 px-4 py-3">

          <CheckCircle2
            size={18}
            className="mt-0.5 shrink-0 text-[#b9d63b]"
          />

          <p className="text-sm text-[#b9d63b]">
            {success}
          </p>

        </div>
      )}

      {/* ======================================
          MAIN
      ====================================== */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">

        {/* ====================================
            CAMERA
        ==================================== */}

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">

          <div className="border-b border-white/10 px-6 py-5">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="font-semibold text-white">
                  QR Scanner
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  Scan a member event QR or
                  guest pass QR.
                </p>

              </div>

              {scanning && (
                <span className="flex items-center gap-2 rounded-full bg-[#b9d63b]/10 px-3 py-1.5 text-xs font-medium text-[#b9d63b]">

                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#b9d63b]" />

                  Scanning

                </span>
              )}

            </div>

          </div>

          <div className="p-6">

            <div className="relative overflow-hidden rounded-2xl bg-black">

              <div
                id={SCANNER_ID}
                className="min-h-[380px] w-full"
              />

              {!scannerReady && (
                <div className="absolute inset-0 flex min-h-[380px] flex-col items-center justify-center px-6 text-center">

                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#b9d63b]/10">

                    <Camera
                      size={32}
                      className="text-[#b9d63b]"
                    />

                  </div>

                  <h3 className="mt-5 font-semibold text-white">
                    Camera Scanner
                  </h3>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-white/35">
                    Scan the QR displayed by
                    the member or guest.
                  </p>

                </div>
              )}

            </div>

            {!scanning ? (
              <button
                type="button"
                onClick={startScanner}
                disabled={checking}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#b9d63b] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#c8e64a] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Camera size={18} />
                Start Camera
              </button>
            ) : (
              <button
                type="button"
                onClick={stopScanner}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <X size={18} />
                Stop Camera
              </button>
            )}

          </div>

        </section>

        {/* ====================================
            CHECK-IN RESULT
        ==================================== */}

        <section className="rounded-2xl border border-white/10 bg-white/[0.03]">

          <div className="border-b border-white/10 px-6 py-5">

            <h2 className="font-semibold text-white">
              Check-in
            </h2>

            <p className="mt-1 text-sm text-white/40">
              Review the scanned QR information.
            </p>

          </div>

          <div className="space-y-5 p-6">

            {/* QR CODE */}

            <div>

              <label className="mb-2 block text-sm font-medium text-white/70">
                QR Code
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">

                <Ticket
                  size={17}
                  className="shrink-0 text-white/25"
                />

                <span className="text-sm font-medium tracking-wide text-white">
                  {code || "No QR scanned"}
                </span>

              </div>

            </div>

            {/* LOADING */}

            {checking && (
              <div className="flex items-center gap-3 rounded-xl border border-[#b9d63b]/20 bg-[#b9d63b]/5 px-4 py-4">

                <Loader2
                  size={20}
                  className="animate-spin text-[#b9d63b]"
                />

                <div>

                  <p className="text-sm font-medium text-white">
                    Processing check-in...
                  </p>

                  <p className="mt-1 text-xs text-white/40">
                    Please wait.
                  </p>

                </div>

              </div>
            )}

            {/* MEMBER RESULT */}

            {result && isMemberResult && (
              <div className="space-y-4">

                <div className="rounded-xl border border-[#b9d63b]/20 bg-[#b9d63b]/5 p-4">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#b9d63b]/10">

                      <User
                        size={18}
                        className="text-[#b9d63b]"
                      />

                    </div>

                    <div>

                      <p className="text-xs text-white/40">
                        Member
                      </p>

                      <p className="font-semibold text-white">
                        {result.member?.name ||
                          "Unknown Member"}
                      </p>

                    </div>

                  </div>

                  <div className="mt-4 space-y-2">

                    {result.member?.mobile && (
                      <div className="flex items-center gap-2 text-sm text-white/60">

                        <Phone size={14} />

                        {result.member.mobile}

                      </div>
                    )}

                    {result.member?.email && (
                      <div className="text-sm text-white/50">
                        {result.member.email}
                      </div>
                    )}

                  </div>

                </div>

                {/* EVENT */}

                {result.event && (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">

                    <div className="flex items-start gap-3">

                      <CalendarDays
                        size={18}
                        className="mt-0.5 text-[#b9d63b]"
                      />

                      <div>

                        <p className="text-xs text-white/40">
                          Event
                        </p>

                        <p className="font-semibold text-white">
                          {result.event.name}
                        </p>

                      </div>

                    </div>

                    {result.event.location && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-white/50">

                        <MapPin size={14} />

                        {result.event.location}

                      </div>
                    )}

                  </div>
                )}

                {/* GUEST RESERVATION */}

                {result.guest?.enabled && (
                  <div className="rounded-xl border border-[#b9d63b]/20 bg-[#b9d63b]/5 p-4">

                    <div className="flex items-center justify-between">

                      <div>

                        <p className="text-xs text-white/40">
                          Registered Guest
                        </p>

                        <p className="mt-1 font-semibold text-white">
                          {result.guest.name ||
                            "Guest"}
                        </p>

                      </div>

                      <span className="rounded-full bg-[#b9d63b]/10 px-3 py-1 text-xs font-medium text-[#b9d63b]">
                        {result.guest.status ||
                          "RESERVED"}
                      </span>

                    </div>

                    {result.guest.mobile && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-white/50">

                        <Phone size={14} />

                        {result.guest.mobile}

                      </div>
                    )}

                    <p className="mt-3 text-xs leading-5 text-white/35">
                      Scan the guest pass separately
                      to check in the guest.
                    </p>

                  </div>
                )}

              </div>
            )}

            {/* GUEST RESULT */}

            {result && isGuestResult && (
              <div className="space-y-4">

                <div className="rounded-xl border border-[#b9d63b]/20 bg-[#b9d63b]/5 p-4">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#b9d63b]/10">

                      <User
                        size={18}
                        className="text-[#b9d63b]"
                      />

                    </div>

                    <div>

                      <p className="text-xs text-white/40">
                        Guest
                      </p>

                      <p className="font-semibold text-white">
                        {result.guest?.name ||
                          "Guest"}
                      </p>

                    </div>

                  </div>

                  {result.guest?.mobile && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-white/50">

                      <Phone size={14} />

                      {result.guest.mobile}

                    </div>
                  )}

                </div>

                {/* HOST MEMBER */}

                {result.member && (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">

                    <p className="text-xs text-white/40">
                      Member / Host
                    </p>

                    <p className="mt-1 font-semibold text-white">
                      {result.member.name}
                    </p>

                    {result.member.mobile && (
                      <p className="mt-2 text-sm text-white/40">
                        {result.member.mobile}
                      </p>
                    )}

                  </div>
                )}

                {/* EVENT */}

                {result.event && (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">

                    <div className="flex items-start gap-3">

                      <CalendarDays
                        size={18}
                        className="mt-0.5 text-[#b9d63b]"
                      />

                      <div>

                        <p className="text-xs text-white/40">
                          Event
                        </p>

                        <p className="font-semibold text-white">
                          {result.event.name}
                        </p>

                      </div>

                    </div>

                    {result.event.location && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-white/50">

                        <MapPin size={14} />

                        {result.event.location}

                      </div>
                    )}

                  </div>
                )}

              </div>
            )}

            {/* EMPTY STATE */}

            {!result && !checking && (
              <div className="rounded-xl border border-dashed border-white/10 bg-black/10 px-5 py-8 text-center">

                <Ticket
                  size={28}
                  className="mx-auto text-white/20"
                />

                <p className="mt-3 text-sm font-medium text-white/60">
                  No check-in yet
                </p>

                <p className="mt-1 text-xs text-white/30">
                  Scan a member or guest QR code.
                </p>

              </div>
            )}

          </div>

        </section>

      </div>

      {/* ======================================
          MANUAL CODE
      ====================================== */}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03]">

        <div className="px-6 py-5">

          <div className="flex items-start gap-3">

            <div className="rounded-lg bg-white/5 p-2">

              <Search
                size={17}
                className="text-white/50"
              />

            </div>

            <div>

              <h3 className="text-sm font-semibold text-white">
                Camera not working?
              </h3>

              <p className="mt-1 text-xs text-white/35">
                Enter an event registration or
                guest pass code manually.
              </p>

            </div>

          </div>

          <form
            onSubmit={handleManualSearch}
            className="mt-4 flex flex-col gap-3 sm:flex-row"
          >

            <input
              value={manualCode}
              onChange={(event) =>
                setManualCode(
                  event.target.value
                    .toUpperCase()
                )
              }
              placeholder="ER-XXXXXXXX or GP-XXXXXXXX"
              className="h-11 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#b9d63b]/40"
            />

            <button
              type="submit"
              disabled={checking}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >

              {checking ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Search size={16} />
              )}

              Check In

            </button>

          </form>

        </div>

      </section>

    </div>
  );
}

/*
 * =============================================
 * EXTRACT QR CODE
 * =============================================
 *
 * Supports:
 *
 * ER-ABC123
 * GP-ABC123
 *
 * URL:
 * https://purple.com/event/ER-ABC123
 *
 * JSON:
 * {"code":"ER-ABC123"}
 */

function extractQRCode(value) {
  if (!value) {
    return null;
  }

  const text =
    value.toString().trim();

  /*
   * Direct ER / GP code.
   */
  const directMatch =
    text.match(
      /(ER|GP)-[A-Z0-9]+(?:-[A-Z0-9]+)?/i
    );

  if (directMatch) {
    return directMatch[0].toUpperCase();
  }

  /*
   * JSON QR.
   */
  try {
    const parsed =
      JSON.parse(text);

    if (parsed?.code) {
      const jsonCode =
        parsed.code
          .toString()
          .trim()
          .toUpperCase();

      if (
        jsonCode.startsWith("ER-") ||
        jsonCode.startsWith("GP-")
      ) {
        return jsonCode;
      }
    }
  } catch {
    // Not JSON.
  }

  /*
   * URL QR.
   */
  try {
    const url =
      new URL(text);

    const code =
      url.searchParams.get("code");

    if (code) {
      const normalized =
        code
          .toUpperCase()
          .trim();

      if (
        normalized.startsWith("ER-") ||
        normalized.startsWith("GP-")
      ) {
        return normalized;
      }
    }

    /*
     * Also support:
     * /event/ER-XXXX
     * /guest-pass/GP-XXXX
     */
    const pathMatch =
      url.pathname.match(
        /(ER|GP)-[A-Z0-9]+(?:-[A-Z0-9]+)?/i
      );

    if (pathMatch) {
      return pathMatch[0].toUpperCase();
    }
  } catch {
    // Not a URL.
  }

  return null;
}

/*
 * =============================================
 * CAMERA ERROR
 * =============================================
 */

function getCameraErrorMessage(error) {
  const message =
    error?.message
      ?.toString()
      .toLowerCase() || "";

  if (
    message.includes("permission") ||
    message.includes("notallowed")
  ) {
    return "Camera permission was denied. Please allow camera access in your browser settings.";
  }

  if (
    message.includes("notfound") ||
    message.includes("no camera")
  ) {
    return "No camera was found on this device.";
  }

  if (
    message.includes("secure context")
  ) {
    return "Camera access requires HTTPS, or localhost during development.";
  }

  return (
    error?.message ||
    "Unable to start the camera. Please check your browser permissions."
  );
}
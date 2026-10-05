"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  ArrowLeft,
  User,
  CreditCard,
  CalendarDays,
  Gift,
  Activity,
  Shirt,
  CheckCircle2,
  Circle,
  Users,
  Ticket,
  Plus,
  X,
} from "lucide-react";

export default function MemberDetailsClient({
  data,
}) {
  const {
    member,
    membership,
    stats,
  } = data;

  /*
   * ============================================
   * MEMBERSHIP DATA
   * ============================================
   */

  const experiencesTotal =
    membership?.sundayExperiences?.total || 0;

  const experiencesUsed =
    membership?.sundayExperiences?.used || 0;

  const experiencesRemaining = Math.max(
    experiencesTotal - experiencesUsed,
    0
  );

  /*
   * ============================================
   * GUEST PASS STATE
   * ============================================
   */

  const [guestPass, setGuestPass] = useState(null);

  const [loadingGuestPass, setLoadingGuestPass] =
    useState(true);

  const [creatingGuestPass, setCreatingGuestPass] =
    useState(false);

  const [guestPassError, setGuestPassError] =
    useState("");

  const [guestPassModal, setGuestPassModal] =
    useState(false);

  /*
   * ============================================
   * FETCH GUEST PASS
   * ============================================
   */

  async function fetchGuestPass() {
    try {
      setLoadingGuestPass(true);

      setGuestPassError("");

      const response = await fetch(
        `/api/admin/guest-passes?memberId=${member._id}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to fetch guest pass."
        );
      }

      const freePass =
        result.passes?.find(
          (pass) => pass.type === "FREE"
        ) || null;

      setGuestPass(freePass);
    } catch (error) {
      console.error(
        "FETCH GUEST PASS ERROR:",
        error
      );

      setGuestPassError(
        error.message ||
          "Failed to load guest pass."
      );
    } finally {
      setLoadingGuestPass(false);
    }
  }

  useEffect(() => {
    if (member?._id) {
      fetchGuestPass();
    }
  }, [member?._id]);

  /*
   * ============================================
   * CREATE FREE GUEST PASS
   * ============================================
   */

  async function createGuestPass() {
    if (!member?._id) {
      setGuestPassError(
        "Member information is missing."
      );

      return;
    }

    try {
      setCreatingGuestPass(true);

      setGuestPassError("");

      const response = await fetch(
        "/api/admin/guest-passes",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            memberId: member._id,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setGuestPassError(
          result.message ||
            "Failed to create guest pass."
        );

        return;
      }

      setGuestPass(result.guestPass);

      setGuestPassModal(false);

      setGuestPassError("");
    } catch (error) {
      console.error(
        "CREATE GUEST PASS ERROR:",
        error
      );

      setGuestPassError(
        "Something went wrong. Please try again."
      );
    } finally {
      setCreatingGuestPass(false);
    }
  }

  /*
   * ============================================
   * OPEN GUEST PASS MODAL
   * ============================================
   */

  function openGuestPassModal() {
    setGuestPassError("");

    setGuestPassModal(true);
  }

  /*
   * ============================================
   * CLOSE GUEST PASS MODAL
   * ============================================
   */

  function closeGuestPassModal() {
    if (creatingGuestPass) {
      return;
    }

    setGuestPassModal(false);

    setGuestPassError("");
  }

  /*
   * ============================================
   * RENDER
   * ============================================
   */

  return (
    <div className="space-y-6 font-sans">

      {/* ======================================== */}
      {/* HEADER */}
      {/* ======================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-center gap-3">

          <Link
            href="/admin/users"
            className="rounded-xl border border-white/10 p-2.5 text-white/50 transition hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft size={18} />
          </Link>

          <div>

            <h1 className="text-2xl font-bold text-white">
              {member.name ||
                "Unnamed Member"}
            </h1>

            <p className="mt-1 text-sm text-white/40">
              Member profile and membership
              details
            </p>

          </div>

        </div>

        <span
          className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-medium ${
            member.isActive
              ? "bg-[#b9d63b]/10 text-[#b9d63b]"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {member.isActive
            ? "Active Member"
            : "Inactive"}
        </span>

      </div>

      {/* ======================================== */}
      {/* PROFILE + STATS */}
      {/* ======================================== */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* MEMBER CARD */}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:col-span-1">

          <div className="flex flex-col items-center text-center">

            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#b9d63b]/10 text-3xl font-bold text-[#b9d63b]">
              {member.name
                ?.charAt(0)
                ?.toUpperCase() || "U"}
            </div>

            <h2 className="mt-4 text-xl font-semibold text-white">
              {member.name ||
                "Unnamed Member"}
            </h2>

            <p className="mt-1 text-sm text-white/40">
              {member.email || "—"}
            </p>

            <p className="mt-1 text-sm text-white/40">
              {member.mobile || "—"}
            </p>

          </div>

          <div className="mt-6 space-y-4 border-t border-white/10 pt-5">

            <InfoRow
              label="City"
              value={
                member.profile?.city ||
                "—"
              }
            />

            <InfoRow
              label="Referral Code"
              value={
                member.referralCode ||
                "—"
              }
            />

            <InfoRow
              label="Joined"
              value={formatDate(
                member.createdAt
              )}
            />

          </div>

        </div>

        {/* STATS */}

        <div className="grid grid-cols-2 gap-4 lg:col-span-2">

          <StatCard
            icon={CreditCard}
            title="Membership"
            value={
              membership
                ? "₹1,499"
                : "Not Active"
            }
          />

          <StatCard
            icon={CalendarDays}
            title="Experiences"
            value={
              membership
                ? `${experiencesUsed}/${experiencesTotal}`
                : "0"
            }
          />

          <StatCard
            icon={Activity}
            title="Attendance"
            value={
              stats?.attendanceCount || 0
            }
          />

          <StatCard
            icon={Users}
            title="Successful Referrals"
            value={
              stats?.referralCount || 0
            }
          />

        </div>

      </div>

      {/* ======================================== */}
      {/* MEMBERSHIP */}
      {/* ======================================== */}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03]">

        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-[#b9d63b]/10 p-3">
              <CreditCard
                size={20}
                className="text-[#b9d63b]"
              />
            </div>

            <div>

              <h2 className="font-semibold text-white">
                Purple Membership
              </h2>

              <p className="text-sm text-white/40">
                ₹1,499 membership details
              </p>

            </div>

          </div>

          {membership && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                membership.status ===
                "ACTIVE"
                  ? "bg-[#b9d63b]/10 text-[#b9d63b]"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {membership.status}
            </span>
          )}

        </div>

        {!membership ? (
          <div className="px-6 py-12 text-center">

            <CreditCard
              size={36}
              className="mx-auto text-white/20"
            />

            <p className="mt-4 font-medium text-white">
              No membership found
            </p>

            <p className="mt-1 text-sm text-white/40">
              Activate the ₹1,499
              membership from the Users
              page.
            </p>

          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-4">

            {/* EXPERIENCES */}

            <MembershipItem
              icon={CalendarDays}
              title="Sunday Experiences"
              value={`${experiencesUsed}/${experiencesTotal}`}
              description={`${experiencesRemaining} remaining`}
            />

            {/* BODY ASSESSMENT */}

            <MembershipItem
              icon={Activity}
              title="Body Assessment"
              value={
                membership.bodyAssessment
                  ?.completed
                  ? "Completed"
                  : "Pending"
              }
              description={
                membership.bodyAssessment
                  ?.completedAt
                  ? formatDate(
                      membership
                        .bodyAssessment
                        .completedAt
                    )
                  : "Not completed"
              }
            />

            {/* T-SHIRT */}

            <MembershipItem
              icon={Shirt}
              title="Purple T-Shirt"
              value={
                membership.purpleKit
                  ?.tshirt
                  ? "Given"
                  : "Pending"
              }
              description="Purple Kit"
            />

            {/* SHAKER */}

            <MembershipItem
              icon={Gift}
              title="Purple Shaker"
              value={
                membership.purpleKit
                  ?.shaker
                  ? "Given"
                  : "Pending"
              }
              description="Purple Kit"
            />

          </div>
        )}

      </section>

      {/* ======================================== */}
      {/* MEMBERSHIP TIMELINE */}
      {/* ======================================== */}

      {membership && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03]">

          <div className="border-b border-white/10 px-6 py-5">

            <h2 className="font-semibold text-white">
              Membership Timeline
            </h2>

          </div>

          <div className="space-y-6 p-6">

            <TimelineItem
              completed
              title="Membership Activated"
              description="₹1,499 Purple Membership"
              date={formatDate(
                membership.createdAt
              )}
            />

            <TimelineItem
              completed={
                membership.bodyAssessment
                  ?.completed
              }
              title="Body Composition Assessment"
              description={
                membership.bodyAssessment
                  ?.completed
                  ? "Assessment completed"
                  : "Assessment pending"
              }
              date={
                membership.bodyAssessment
                  ?.completedAt
                  ? formatDate(
                      membership
                        .bodyAssessment
                        .completedAt
                    )
                  : null
              }
            />

            <TimelineItem
              completed={
                experiencesUsed > 0
              }
              title="Sunday Experiences"
              description={`${experiencesUsed} of ${experiencesTotal} experiences used`}
              date={null}
            />

            <TimelineItem
              completed={
                membership.purpleKit
                  ?.tshirt &&
                membership.purpleKit
                  ?.shaker
              }
              title="Purple Kit"
              description={
                membership.purpleKit
                  ?.tshirt &&
                membership.purpleKit
                  ?.shaker
                  ? "T-shirt and shaker given"
                  : "Kit pending"
              }
              date={null}
            />

          </div>

        </section>
      )}

      {/* ======================================== */}
      {/* GUEST PASS */}
      {/* ======================================== */}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03]">

        <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-[#b9d63b]/10 p-3">
              <Ticket
                size={20}
                className="text-[#b9d63b]"
              />
            </div>

            <div>

              <h2 className="font-semibold text-white">
                Guest Pass
              </h2>

              <p className="text-sm text-white/40">
                One free guest pass per
                member
              </p>

            </div>

          </div>

          {!loadingGuestPass &&
            !guestPass && (
              <button
                type="button"
                onClick={openGuestPassModal}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#b9d63b] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#c8e64a]"
              >
                <Plus size={16} />
                Give Free Pass
              </button>
            )}

        </div>

        <div className="p-6">

          {loadingGuestPass ? (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/10 p-5">

              <div className="h-9 w-9 animate-pulse rounded-lg bg-white/10" />

              <div className="space-y-2">

                <div className="h-3 w-28 animate-pulse rounded bg-white/10" />

                <div className="h-2.5 w-44 animate-pulse rounded bg-white/5" />

              </div>

            </div>
          ) : guestPass ? (
            <GuestPassCard
              guestPass={guestPass}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 bg-black/10 px-6 py-10 text-center">

              <Ticket
                size={34}
                className="mx-auto text-white/20"
              />

              <p className="mt-4 font-medium text-white">
                Free guest pass not issued
              </p>

              <p className="mt-1 text-sm text-white/40">
                Give this member their
                one-time free guest pass.
              </p>

              <button
                type="button"
                onClick={openGuestPassModal}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#b9d63b] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#c8e64a]"
              >
                <Plus size={16} />
                Give Free Pass
              </button>

            </div>
          )}

          {guestPassError && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {guestPassError}
            </div>
          )}

        </div>

      </section>

      {/* ======================================== */}
      {/* QUICK INFORMATION */}
      {/* ======================================== */}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">

        <QuickCard
          icon={Gift}
          title="Guest Passes"
          value={
            guestPass ? 1 : 0
          }
        />

        <QuickCard
          icon={Activity}
          title="Attendance"
          value={
            stats?.attendanceCount || 0
          }
        />

        <QuickCard
          icon={Users}
          title="Referrals"
          value={
            stats?.referralCount || 0
          }
        />

      </section>

      {/* ======================================== */}
      {/* GUEST PASS MODAL */}
      {/* ======================================== */}

      {guestPassModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !creatingGuestPass
            ) {
              closeGuestPassModal();
            }
          }}
        >

          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#17111f] shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">

              <div>

                <h2 className="text-lg font-semibold text-white">
                  Give Free Guest Pass
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  Issue the member's one-time
                  free guest pass.
                </p>

              </div>

              <button
                type="button"
                disabled={
                  creatingGuestPass
                }
                onClick={
                  closeGuestPassModal
                }
                className="rounded-lg p-2 text-white/40 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X size={20} />
              </button>

            </div>

            {/* MODAL BODY */}

            <div className="space-y-5 p-6">

              {/* MEMBER */}

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">

                <p className="text-xs uppercase tracking-wider text-white/30">
                  Member
                </p>

                <p className="mt-2 font-semibold text-white">
                  {member.name ||
                    "Unnamed Member"}
                </p>

                <p className="mt-1 text-sm text-white/40">
                  {member.email ||
                    member.mobile ||
                    "—"}
                </p>

              </div>

              {/* PASS INFORMATION */}

              <div className="rounded-xl border border-[#b9d63b]/20 bg-[#b9d63b]/5 p-4">

                <div className="flex items-start gap-3">

                  <div className="rounded-lg bg-[#b9d63b]/10 p-2">
                    <Ticket
                      size={18}
                      className="text-[#b9d63b]"
                    />
                  </div>

                  <div>

                    <p className="font-medium text-white">
                      Free Guest Pass
                    </p>

                    <p className="mt-1 text-sm leading-5 text-white/40">
                      This member gets one
                      free guest pass. Once
                      used, another free
                      guest pass cannot be
                      issued.
                    </p>

                  </div>

                </div>

              </div>

              {/* ERROR */}

              {guestPassError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {guestPassError}
                </div>
              )}

              {/* ACTIONS */}

              <div className="flex gap-3">

                <button
                  type="button"
                  disabled={
                    creatingGuestPass
                  }
                  onClick={
                    closeGuestPassModal
                  }
                  className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white/60 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    creatingGuestPass
                  }
                  onClick={
                    createGuestPass
                  }
                  className="flex-1 rounded-xl bg-[#b9d63b] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#c8e64a] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingGuestPass
                    ? "Creating..."
                    : "Give Free Pass"}
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

/* ================================================= */
/* GUEST PASS CARD */
/* ================================================= */

function GuestPassCard({
  guestPass,
}) {
  const isUsed =
    guestPass.status === "USED";

  return (
    <div
      className={`rounded-2xl border p-5 ${
        isUsed
          ? "border-white/10 bg-white/[0.02]"
          : "border-[#b9d63b]/20 bg-[#b9d63b]/5"
      }`}
    >

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-start gap-4">

          <div
            className={`rounded-xl p-3 ${
              isUsed
                ? "bg-white/5"
                : "bg-[#b9d63b]/10"
            }`}
          >
            <Ticket
              size={22}
              className={
                isUsed
                  ? "text-white/30"
                  : "text-[#b9d63b]"
              }
            />
          </div>

          <div>

            <div className="flex flex-wrap items-center gap-2">

              <p className="font-semibold text-white">
                Free Guest Pass
              </p>

              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                  isUsed
                    ? "bg-red-500/10 text-red-400"
                    : "bg-[#b9d63b]/10 text-[#b9d63b]"
                }`}
              >
                {isUsed
                  ? "Used"
                  : "Available"}
              </span>

            </div>

            <p className="mt-2 text-sm text-white/40">
              Guest pass code
            </p>

            <p className="mt-1 font-mono text-sm font-semibold tracking-wider text-white">
              {guestPass.code}
            </p>

          </div>

        </div>

        <div className="sm:text-right">

          <p className="text-xs text-white/30">
            Issued
          </p>

          <p className="mt-1 text-sm text-white/60">
            {formatDate(
              guestPass.createdAt
            )}
          </p>

          {guestPass.usedAt && (
            <>
              <p className="mt-3 text-xs text-white/30">
                Used
              </p>

              <p className="mt-1 text-sm text-white/60">
                {formatDate(
                  guestPass.usedAt
                )}
              </p>
            </>
          )}

        </div>

      </div>

    </div>
  );
}

/* ================================================= */
/* INFO ROW */
/* ================================================= */

function InfoRow({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between gap-4">

      <span className="text-sm text-white/40">
        {label}
      </span>

      <span className="max-w-[60%] truncate text-right text-sm text-white">
        {value}
      </span>

    </div>
  );
}

/* ================================================= */
/* STAT CARD */
/* ================================================= */

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

/* ================================================= */
/* MEMBERSHIP ITEM */
/* ================================================= */

function MembershipItem({
  icon: Icon,
  title,
  value,
  description,
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/10 p-4">

      <div className="flex items-start justify-between gap-3">

        <div>

          <p className="text-xs text-white/40">
            {title}
          </p>

          <p className="mt-2 text-lg font-semibold text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-white/30">
            {description}
          </p>

        </div>

        <div className="rounded-lg bg-[#b9d63b]/10 p-2">
          <Icon
            size={17}
            className="text-[#b9d63b]"
          />
        </div>

      </div>

    </div>
  );
}

/* ================================================= */
/* TIMELINE ITEM */
/* ================================================= */

function TimelineItem({
  completed,
  title,
  description,
  date,
}) {
  return (
    <div className="flex gap-4">

      <div className="flex flex-col items-center">

        {completed ? (
          <CheckCircle2
            size={22}
            className="shrink-0 text-[#b9d63b]"
          />
        ) : (
          <Circle
            size={22}
            className="shrink-0 text-white/20"
          />
        )}

      </div>

      <div className="pb-2">

        <p
          className={`font-medium ${
            completed
              ? "text-white"
              : "text-white/50"
          }`}
        >
          {title}
        </p>

        <p className="mt-1 text-sm text-white/40">
          {description}
        </p>

        {date && (
          <p className="mt-1 text-xs text-white/25">
            {date}
          </p>
        )}

      </div>

    </div>
  );
}

/* ================================================= */
/* QUICK CARD */
/* ================================================= */

function QuickCard({
  icon: Icon,
  title,
  value,
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">

      <div className="rounded-xl bg-[#b9d63b]/10 p-3">
        <Icon
          size={20}
          className="text-[#b9d63b]"
        />
      </div>

      <div>

        <p className="text-sm text-white/40">
          {title}
        </p>

        <p className="mt-1 text-xl font-bold text-white">
          {value}
        </p>

      </div>

    </div>
  );
}

/* ================================================= */
/* DATE FORMATTER */
/* ================================================= */

function formatDate(date) {
  if (!date) {
    return "—";
  }

  const parsed = new Date(date);

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
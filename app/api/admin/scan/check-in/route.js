import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { auth } from "@/lib/auth";
import { getDB } from "@/lib/db";

export async function POST(request) {
  try {
    // =====================================================
    // ADMIN AUTH
    // =====================================================

    const session = await auth();

    if (
      !session?.user ||
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    // =====================================================
    // REQUEST
    // =====================================================

    const body = await request.json();

    const code = body?.code
      ?.toString()
      .trim()
      .toUpperCase();

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          message: "QR code is required.",
        },
        { status: 400 }
      );
    }

    const db = await getDB();

    // =====================================================
    // GUEST PASS QR
    // =====================================================

    if (code.startsWith("GP-")) {
      const guestPass =
        await db.collection("guest_passes").findOne({
          code,
        });

      if (!guestPass) {
        return NextResponse.json(
          {
            success: false,
            type: "GUEST_PASS",
            message: "Guest pass not found.",
          },
          { status: 404 }
        );
      }

      if (guestPass.type !== "FREE") {
        return NextResponse.json(
          {
            success: false,
            type: "GUEST_PASS",
            message: "Invalid guest pass type.",
          },
          { status: 400 }
        );
      }

      // ---------------------------------------------------
      // PASS STATUS
      // ---------------------------------------------------

      if (guestPass.status === "AVAILABLE") {
        return NextResponse.json(
          {
            success: false,
            type: "GUEST_PASS",
            message:
              "This guest pass has not been reserved for an event.",
          },
          { status: 400 }
        );
      }

      if (guestPass.status === "USED") {
        return NextResponse.json(
          {
            success: false,
            type: "GUEST_PASS",
            message:
              "This guest pass has already been used.",
          },
          { status: 409 }
        );
      }

      if (guestPass.status !== "RESERVED") {
        return NextResponse.json(
          {
            success: false,
            type: "GUEST_PASS",
            message:
              "This guest pass is not available for check-in.",
          },
          { status: 400 }
        );
      }

      // ---------------------------------------------------
      // EVENT ID
      // ---------------------------------------------------

      if (
        !guestPass.eventId ||
        !ObjectId.isValid(
          guestPass.eventId.toString()
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            type: "GUEST_PASS",
            message:
              "This guest pass is not linked to an event.",
          },
          { status: 400 }
        );
      }

      // ---------------------------------------------------
      // EVENT
      // ---------------------------------------------------

      const event =
        await db.collection("events").findOne({
          _id: guestPass.eventId,
        });

      if (!event) {
        return NextResponse.json(
          {
            success: false,
            type: "GUEST_PASS",
            message:
              "The event associated with this guest pass was not found.",
          },
          { status: 404 }
        );
      }

      if (event.status === "CANCELLED") {
        return NextResponse.json(
          {
            success: false,
            type: "GUEST_PASS",
            message:
              "This event has been cancelled.",
          },
          { status: 400 }
        );
      }

      // ---------------------------------------------------
      // MEMBER
      // ---------------------------------------------------

      const member =
        await db.collection("members").findOne({
          _id: guestPass.memberId,
        });

      if (!member) {
        return NextResponse.json(
          {
            success: false,
            type: "GUEST_PASS",
            message:
              "The member associated with this guest pass was not found.",
          },
          { status: 404 }
        );
      }

      // ---------------------------------------------------
      // REGISTRATION
      // ---------------------------------------------------
      //
      // Supports:
      // GUEST
      // SELF_PASS
      //
      // We primarily identify the registration by
      // guestPassId so both types work.
      //

      const registration =
        await db
          .collection("event_registrations")
          .findOne({
            eventId: guestPass.eventId,
            memberId: guestPass.memberId,
            "guest.guestPassId":
              guestPass._id,
            status: {
              $in: [
                "REGISTERED",
                "ATTENDED",
              ],
            },
          });

      if (!registration) {
        return NextResponse.json(
          {
            success: false,
            type: "GUEST_PASS",
            message:
              "The guest reservation for this event could not be found.",
          },
          { status: 404 }
        );
      }

      // ---------------------------------------------------
      // ALREADY ATTENDED
      // ---------------------------------------------------

      if (
        registration.status === "ATTENDED" ||
        registration.guest?.status === "ATTENDED"
      ) {
        return NextResponse.json(
          {
            success: false,
            type: "GUEST_PASS",
            message:
              "This guest has already been checked in.",
          },
          { status: 409 }
        );
      }

      const now = new Date();

      // ===================================================
      // MARK GUEST PASS USED
      // ===================================================

      const passUpdate =
        await db
          .collection("guest_passes")
          .updateOne(
            {
              _id: guestPass._id,
              status: "RESERVED",
            },
            {
              $set: {
                status: "USED",

                usedAt: now,

                usedBy:
                  new ObjectId(
                    session.user.id
                  ),

                updatedAt: now,
              },
            }
          );

      if (passUpdate.modifiedCount !== 1) {
        return NextResponse.json(
          {
            success: false,
            type: "GUEST_PASS",
            message:
              "This guest pass was already checked in or is no longer available.",
          },
          { status: 409 }
        );
      }

      // ===================================================
      // UPDATE REGISTRATION
      // ===================================================

      const registrationUpdate =
        await db
          .collection("event_registrations")
          .updateOne(
            {
              _id: registration._id,
              status: "REGISTERED",
            },
            {
              $set: {
                status: "ATTENDED",

                attendedAt: now,

                "guest.status":
                  "ATTENDED",

                updatedAt: now,
              },
            }
          );

      if (
        registrationUpdate.modifiedCount !== 1
      ) {
        // -----------------------------------------------
        // ROLLBACK PASS
        // -----------------------------------------------

        await db
          .collection("guest_passes")
          .updateOne(
            {
              _id: guestPass._id,
              status: "USED",
            },
            {
              $set: {
                status: "RESERVED",

                usedAt: null,

                usedBy: null,

                updatedAt: new Date(),
              },
            }
          );

        return NextResponse.json(
          {
            success: false,
            type: "GUEST_PASS",
            message:
              "Guest check-in could not be completed. Please scan again.",
          },
          { status: 409 }
        );
      }

      // ===================================================
      // CREATE ATTENDANCE
      // ===================================================

      const attendance = {
        memberId:
          guestPass.memberId,

        eventId:
          guestPass.eventId,

        registrationId:
          registration._id,

        type: "GUEST_PASS",

        registrationType:
          registration.registrationType ||
          (
            registration.passUsage ===
            "SELF"
              ? "SELF_PASS"
              : "GUEST"
          ),

        status: "PRESENT",

        guestPassId:
          guestPass._id,

        guestPassCode:
          guestPass.code,

        guest: {
          name:
            registration.guest?.name ||
            "",

          mobile:
            registration.guest?.mobile ||
            "",
        },

        checkedInAt: now,

        checkedInBy:
          new ObjectId(
            session.user.id
          ),

        createdAt: now,

        updatedAt: now,
      };

      const attendanceResult =
        await db
          .collection("attendance")
          .insertOne(attendance);

      return NextResponse.json({
        success: true,

        type: "GUEST_PASS",

        message:
          "Guest checked in successfully.",

        data: {
          attendanceId:
            attendanceResult.insertedId.toString(),

          guestPassId:
            guestPass._id.toString(),

          guestPassCode:
            guestPass.code,

          registrationId:
            registration._id.toString(),

          registrationType:
            registration.registrationType ||
            (
              registration.passUsage ===
              "SELF"
                ? "SELF_PASS"
                : "GUEST"
            ),

          member: {
            id:
              member._id.toString(),

            name:
              member.name || "",

            mobile:
              member.mobile || "",

            email:
              member.email || "",
          },

          guest: {
            name:
              registration.guest?.name ||
              "",

            mobile:
              registration.guest?.mobile ||
              "",

            status: "ATTENDED",
          },

          event: {
            id:
              event._id.toString(),

            name:
              event.name || "",

            date:
              event.date || null,

            startTime:
              event.startTime || "",

            endTime:
              event.endTime || "",

            location:
              event.location || "",
          },

          checkedInAt: now,
        },
      });
    }

    // =====================================================
    // MEMBER EVENT QR
    // =====================================================

    if (code.startsWith("ER-")) {
      const registration =
        await db
          .collection("event_registrations")
          .findOne({
            qrCode: code,
          });

      if (!registration) {
        return NextResponse.json(
          {
            success: false,
            type: "EVENT",
            message:
              "Event registration QR code not found.",
          },
          { status: 404 }
        );
      }

      // ---------------------------------------------------
      // ALREADY ATTENDED
      // ---------------------------------------------------

      if (
        registration.status ===
        "ATTENDED"
      ) {
        return NextResponse.json(
          {
            success: false,
            type: "EVENT",
            message:
              "This member has already been checked in for this event.",
          },
          { status: 409 }
        );
      }

      if (
        registration.status !==
        "REGISTERED"
      ) {
        return NextResponse.json(
          {
            success: false,
            type: "EVENT",
            message:
              "This registration is not active.",
          },
          { status: 400 }
        );
      }

      // ---------------------------------------------------
      // DETERMINE REGISTRATION TYPE
      // ---------------------------------------------------

      const registrationType =
        registration.registrationType ||
        (
          registration.passUsage ===
          "GUEST"
            ? "GUEST"
            : registration.passUsage ===
              "SELF"
              ? "SELF_PASS"
              : "MEMBERSHIP"
        );

      // ---------------------------------------------------
      // EVENT
      // ---------------------------------------------------

      const event =
        await db.collection("events").findOne({
          _id: registration.eventId,
        });

      if (!event) {
        return NextResponse.json(
          {
            success: false,
            type: "EVENT",
            message:
              "Event associated with this QR code was not found.",
          },
          { status: 404 }
        );
      }

      if (event.status === "CANCELLED") {
        return NextResponse.json(
          {
            success: false,
            type: "EVENT",
            message:
              "This event has been cancelled.",
          },
          { status: 400 }
        );
      }

      // ---------------------------------------------------
      // MEMBER
      // ---------------------------------------------------

      const member =
        await db.collection("members").findOne({
          _id: registration.memberId,
        });

      if (!member) {
        return NextResponse.json(
          {
            success: false,
            type: "EVENT",
            message:
              "Member associated with this registration was not found.",
          },
          { status: 404 }
        );
      }

      const now = new Date();

      // ===================================================
      // MEMBERSHIP REGISTRATION
      // ===================================================
      //
      // IMPORTANT:
      //
      // Registration:
      // reserved + 1
      //
      // Actual QR scan:
      // reserved - 1
      // used + 1
      //
      // Therefore the Sunday experience is consumed
      // ONLY when the member actually checks in.
      //

      let membership = null;

      if (
        registrationType ===
        "MEMBERSHIP"
      ) {
        membership =
          await db
            .collection("memberships")
            .findOne({
              _id:
                registration.membershipId ||
                undefined,

              memberId:
                registration.memberId,

              plan:
                "PURPLE_MEMBERSHIP",

              status:
                "ACTIVE",
            });

        // If membershipId was not stored in the
        // registration, fall back to memberId.
        if (!membership) {
          membership =
            await db
              .collection("memberships")
              .findOne({
                memberId:
                  registration.memberId,

                plan:
                  "PURPLE_MEMBERSHIP",

                status:
                  "ACTIVE",
              });
        }

        if (!membership) {
          return NextResponse.json(
            {
              success: false,
              type: "EVENT",
              message:
                "Active Purple Membership was not found for this registration.",
            },
            { status: 404 }
          );
        }

        const total =
          Number(
            membership.sundayExperiences
              ?.total
          ) || 4;

        const used =
          Number(
            membership.sundayExperiences
              ?.used
          ) || 0;

        const reserved =
          Number(
            membership.sundayExperiences
              ?.reserved
          ) || 0;

        // -----------------------------------------------
        // MUST HAVE RESERVED EXPERIENCE
        // -----------------------------------------------

        if (reserved <= 0) {
          return NextResponse.json(
            {
              success: false,
              type: "EVENT",
              message:
                "This membership does not have a reserved Sunday experience for this registration.",
            },
            { status: 409 }
          );
        }

        // -----------------------------------------------
        // CANNOT EXCEED TOTAL
        // -----------------------------------------------

        if (used >= total) {
          return NextResponse.json(
            {
              success: false,
              type: "EVENT",
              message:
                "All Sunday experiences included with this membership have already been used.",
            },
            { status: 409 }
          );
        }

        // -----------------------------------------------
        // ATOMIC GUARD
        // -----------------------------------------------

        const experienceUpdate =
          await db
            .collection("memberships")
            .updateOne(
              {
                _id:
                  membership._id,

                status:
                  "ACTIVE",

                $expr: {
                  $and: [
                    {
                      $gt: [
                        {
                          $ifNull: [
                            "$sundayExperiences.reserved",
                            0,
                          ],
                        },
                        0,
                      ],
                    },

                    {
                      $lt: [
                        {
                          $ifNull: [
                            "$sundayExperiences.used",
                            0,
                          ],
                        },

                        {
                          $ifNull: [
                            "$sundayExperiences.total",
                            4,
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
              {
                $inc: {
                  "sundayExperiences.reserved":
                    -1,

                  "sundayExperiences.used":
                    1,
                },

                $set: {
                  updatedAt: now,
                },
              }
            );

        // -----------------------------------------------
        // SOMEONE ELSE USED IT FIRST
        // -----------------------------------------------

        if (
          experienceUpdate.modifiedCount !==
          1
        ) {
          return NextResponse.json(
            {
              success: false,
              type: "EVENT",
              message:
                "This Sunday experience is no longer available. Please scan again.",
            },
            { status: 409 }
          );
        }
      }

      // ===================================================
      // SELF PASS / GUEST PASS REGISTRATION
      // ===================================================

      let guestPass = null;
      let passWasUsed = false;

      if (
        registrationType ===
          "SELF_PASS" ||
        registrationType ===
          "GUEST"
      ) {
        // -----------------------------------------------
        // GET PASS ID
        // -----------------------------------------------

        const guestPassId =
          registration.guest
            ?.guestPassId;

        if (
          !guestPassId ||
          !ObjectId.isValid(
            guestPassId.toString()
          )
        ) {
          // Roll back membership if somehow this
          // registration was incorrectly mixed with
          // membership consumption.
          if (
            registrationType ===
            "MEMBERSHIP"
          ) {
            await db
              .collection("memberships")
              .updateOne(
                {
                  _id:
                    membership._id,

                  status:
                    "ACTIVE",
                },
                {
                  $inc: {
                    "sundayExperiences.reserved":
                      1,

                    "sundayExperiences.used":
                      -1,
                  },

                  $set: {
                    updatedAt:
                      new Date(),
                  },
                }
              );
          }

          return NextResponse.json(
            {
              success: false,
              type: "EVENT",
              message:
                "The free pass associated with this registration is invalid.",
            },
            { status: 400 }
          );
        }

        guestPass =
          await db
            .collection("guest_passes")
            .findOne({
              _id:
                new ObjectId(
                  guestPassId.toString()
                ),

              memberId:
                registration.memberId,

              type:
                "FREE",
            });

        if (!guestPass) {
          return NextResponse.json(
            {
              success: false,
              type: "EVENT",
              message:
                "The free pass associated with this registration was not found.",
            },
            { status: 404 }
          );
        }

        if (
          guestPass.status ===
          "USED"
        ) {
          return NextResponse.json(
            {
              success: false,
              type: "EVENT",
              message:
                "This free pass has already been used.",
            },
            { status: 409 }
          );
        }

        if (
          guestPass.status !==
          "RESERVED"
        ) {
          return NextResponse.json(
            {
              success: false,
              type: "EVENT",
              message:
                "This free pass is not available for check-in.",
            },
            { status: 400 }
          );
        }

        // -----------------------------------------------
        // PASS MUST BELONG TO SAME EVENT
        // -----------------------------------------------

        if (
          !guestPass.eventId ||
          guestPass.eventId.toString() !==
            registration.eventId.toString()
        ) {
          return NextResponse.json(
            {
              success: false,
              type: "EVENT",
              message:
                "This free pass is not linked to this event.",
            },
            { status: 400 }
          );
        }

        // -----------------------------------------------
        // RESERVED -> USED
        // -----------------------------------------------

        const passUpdate =
          await db
            .collection("guest_passes")
            .updateOne(
              {
                _id:
                  guestPass._id,

                memberId:
                  registration.memberId,

                type:
                  "FREE",

                status:
                  "RESERVED",

                eventId:
                  registration.eventId,
              },
              {
                $set: {
                  status:
                    "USED",

                  usedAt:
                    now,

                  usedBy:
                    new ObjectId(
                      session.user.id
                    ),

                  updatedAt:
                    now,
                },
              }
            );

        if (
          passUpdate.modifiedCount !==
          1
        ) {
          return NextResponse.json(
            {
              success: false,
              type: "EVENT",
              message:
                "This free pass was already used or is no longer available.",
            },
            { status: 409 }
          );
        }

        passWasUsed = true;
      }

      // ===================================================
      // UPDATE EVENT REGISTRATION
      // ===================================================

      const updateResult =
        await db
          .collection("event_registrations")
          .updateOne(
            {
              _id:
                registration._id,

              status:
                "REGISTERED",
            },
            {
              $set: {
                status:
                  "ATTENDED",

                attendedAt:
                  now,

                updatedAt:
                  now,

                ...(registrationType ===
                  "MEMBERSHIP"
                  ? {
                      experienceStatus:
                        "USED",
                    }
                  : {}),

                ...(
                  registrationType ===
                    "SELF_PASS" ||
                  registrationType ===
                    "GUEST"
                    ? {
                        "guest.status":
                          "ATTENDED",
                      }
                    : {}
                ),
              },
            }
          );

      if (
        updateResult.modifiedCount !==
        1
      ) {
        // =================================================
        // ROLLBACK MEMBERSHIP EXPERIENCE
        // =================================================

        if (
          registrationType ===
            "MEMBERSHIP" &&
          membership
        ) {
          await db
            .collection("memberships")
            .updateOne(
              {
                _id:
                  membership._id,

                status:
                  "ACTIVE",
              },
              {
                $inc: {
                  "sundayExperiences.reserved":
                    1,

                  "sundayExperiences.used":
                    -1,
                },

                $set: {
                  updatedAt:
                    new Date(),
                },
              }
            );
        }

        // =================================================
        // ROLLBACK FREE PASS
        // =================================================

        if (
          passWasUsed &&
          guestPass
        ) {
          await db
            .collection("guest_passes")
            .updateOne(
              {
                _id:
                  guestPass._id,

                status:
                  "USED",
              },
              {
                $set: {
                  status:
                    "RESERVED",

                  usedAt:
                    null,

                  usedBy:
                    null,

                  updatedAt:
                    new Date(),
                },
              }
            );
        }

        return NextResponse.json(
          {
            success: false,
            type: "EVENT",
            message:
              "This registration was already checked in. No additional experience or pass was consumed.",
          },
          { status: 409 }
        );
      }

      // ===================================================
      // CREATE ATTENDANCE
      // ===================================================

      const attendance = {
        memberId:
          registration.memberId,

        eventId:
          registration.eventId,

        registrationId:
          registration._id,

        type:
          "EVENT",

        registrationType,

        status:
          "PRESENT",

        checkedInAt:
          now,

        checkedInBy:
          new ObjectId(
            session.user.id
          ),

        createdAt:
          now,

        updatedAt:
          now,
      };

      if (
        registrationType ===
        "MEMBERSHIP"
      ) {
        attendance.experienceStatus =
          "USED";
      }

      if (
        registrationType ===
          "SELF_PASS" ||
        registrationType ===
          "GUEST"
      ) {
        attendance.guestPassId =
          guestPass?._id || null;

        attendance.guestPassCode =
          guestPass?.code || null;

        attendance.guest = {
          name:
            registration.guest?.name ||
            "",

          mobile:
            registration.guest?.mobile ||
            "",
        };
      }

      let attendanceResult;

      try {
        attendanceResult =
          await db
            .collection("attendance")
            .insertOne(
              attendance
            );
      } catch (attendanceError) {
        console.error(
          "ATTENDANCE INSERT ERROR:",
          attendanceError
        );

        // -----------------------------------------------
        // ROLLBACK REGISTRATION
        // -----------------------------------------------

        await db
          .collection("event_registrations")
          .updateOne(
            {
              _id:
                registration._id,

              status:
                "ATTENDED",
            },
            {
              $set: {
                status:
                  "REGISTERED",

                attendedAt:
                  null,

                ...(registrationType ===
                  "MEMBERSHIP"
                  ? {
                      experienceStatus:
                        "RESERVED",
                    }
                  : {}),

                ...(
                  registrationType ===
                    "SELF_PASS" ||
                  registrationType ===
                    "GUEST"
                    ? {
                        "guest.status":
                          "RESERVED",
                      }
                    : {}
                ),

                updatedAt:
                  new Date(),
              },
            }
          );

        // -----------------------------------------------
        // ROLLBACK MEMBERSHIP
        // -----------------------------------------------

        if (
          registrationType ===
            "MEMBERSHIP" &&
          membership
        ) {
          await db
            .collection("memberships")
            .updateOne(
              {
                _id:
                  membership._id,

                status:
                  "ACTIVE",
              },
              {
                $inc: {
                  "sundayExperiences.reserved":
                    1,

                  "sundayExperiences.used":
                    -1,
                },

                $set: {
                  updatedAt:
                    new Date(),
                },
              }
            );
        }

        // -----------------------------------------------
        // ROLLBACK FREE PASS
        // -----------------------------------------------

        if (
          passWasUsed &&
          guestPass
        ) {
          await db
            .collection("guest_passes")
            .updateOne(
              {
                _id:
                  guestPass._id,

                status:
                  "USED",
              },
              {
                $set: {
                  status:
                    "RESERVED",

                  usedAt:
                    null,

                  usedBy:
                    null,

                  updatedAt:
                    new Date(),
                },
              }
            );
        }

        return NextResponse.json(
          {
            success: false,
            type: "EVENT",
            message:
              "Check-in could not be completed. Please scan again.",
          },
          { status: 500 }
        );
      }

      // ===================================================
      // MEMBER RESPONSE
      // ===================================================

      return NextResponse.json({
        success: true,

        type:
          "EVENT",

        message:
          registrationType ===
          "MEMBERSHIP"
            ? "Member checked in successfully. One Sunday experience has been used."
            : registrationType ===
                "SELF_PASS"
              ? "Member checked in successfully using the free pass."
              : "Guest checked in successfully using the free pass.",

        data: {
          attendanceId:
            attendanceResult.insertedId.toString(),

          registrationId:
            registration._id.toString(),

          registrationType,

          qrCode:
            registration.qrCode,

          member: {
            id:
              member._id.toString(),

            name:
              member.name || "",

            mobile:
              member.mobile || "",

            email:
              member.email || "",
          },

          event: {
            id:
              event._id.toString(),

            name:
              event.name || "",

            date:
              event.date || null,

            startTime:
              event.startTime || "",

            endTime:
              event.endTime || "",

            location:
              event.location || "",
          },

          // ---------------------------------------------
          // MEMBERSHIP EXPERIENCE
          // ---------------------------------------------

          membershipExperience:
            registrationType ===
            "MEMBERSHIP"
              ? {
                  consumed:
                    true,

                  status:
                    "USED",

                  total:
                    Number(
                      membership
                        ?.sundayExperiences
                        ?.total
                    ) || 4,

                  used:
                    Number(
                      membership
                        ?.sundayExperiences
                        ?.used
                    ) + 1,

                  reserved:
                    Math.max(
                      Number(
                        membership
                          ?.sundayExperiences
                          ?.reserved
                      ) - 1,
                      0
                    ),
                }
              : null,

          // ---------------------------------------------
          // FREE PASS
          // ---------------------------------------------

          guestPass:
            guestPass
              ? {
                  id:
                    guestPass._id.toString(),

                  code:
                    guestPass.code,

                  status:
                    "USED",

                  usage:
                    registrationType,
                }
              : null,

          // ---------------------------------------------
          // GUEST
          // ---------------------------------------------

          guest:
            registration.guest?.enabled ||
            registrationType ===
              "GUEST"
              ? {
                  enabled:
                    true,

                  name:
                    registration.guest
                      ?.name || "",

                  mobile:
                    registration.guest
                      ?.mobile || "",

                  guestPassId:
                    registration.guest
                      ?.guestPassId
                      ?.toString() ||
                    null,

                  status:
                    "ATTENDED",
                }
              : {
                  enabled:
                    false,
                },

          checkedInAt:
            now,
        },
      });
    }

    // =====================================================
    // UNKNOWN QR
    // =====================================================

    return NextResponse.json(
      {
        success: false,

        message:
          "This is not a valid Purple guest pass or event registration QR.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error(
      "UNIFIED QR CHECK-IN ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Failed to process QR check-in.",
      },
      { status: 500 }
    );
  }
}
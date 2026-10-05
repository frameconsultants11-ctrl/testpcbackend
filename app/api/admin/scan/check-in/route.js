import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { auth } from "@/lib/auth";
import { getDB } from "@/lib/db";

export async function POST(request) {
  try {
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

    const body = await request.json();

    const code =
      body?.code
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

    /*
     * =====================================================
     * GUEST PASS QR
     * =====================================================
     *
     * Guest pass is already reserved for an event.
     *
     * AVAILABLE  -> can be reserved
     * RESERVED   -> waiting for event check-in
     * USED       -> guest checked in
     */

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

      /*
       * Guest must have been reserved
       * for an event before arriving.
       */
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

      /*
       * Reserved guest pass must have
       * an event attached.
       */
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

      /*
       * Find event.
       */
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

      /*
       * Find member who owns the guest pass.
       */
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

      /*
       * Find the event registration that
       * reserved this guest pass.
       */
      const registration =
        await db
          .collection("event_registrations")
          .findOne({
            eventId: guestPass.eventId,

            memberId: guestPass.memberId,

            "guest.enabled": true,

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

      /*
       * Guest already checked in.
       */
      if (
        registration.guest?.status ===
        "ATTENDED"
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

      /*
       * ==========================================
       * MARK GUEST PASS USED
       * ==========================================
       *
       * No transaction.
       * No startSession.
       * No findOneAndUpdate.
       */

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

      if (
        passUpdate.modifiedCount !== 1
      ) {
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

      /*
       * ==========================================
       * UPDATE EVENT REGISTRATION GUEST
       * ==========================================
       */

      const registrationUpdate =
        await db
          .collection("event_registrations")
          .updateOne(
            {
              _id: registration._id,

              "guest.status": "RESERVED",
            },
            {
              $set: {
                "guest.status":
                  "ATTENDED",

                updatedAt: now,
              },
            }
          );

      if (
        registrationUpdate.modifiedCount !==
        1
      ) {
        /*
         * We don't have transactions on
         * this MongoDB deployment.
         *
         * Try to restore the guest pass
         * if registration update failed.
         */

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

      /*
       * ==========================================
       * CREATE GUEST ATTENDANCE
       * ==========================================
       */

      const attendance = {
        memberId:
          guestPass.memberId,

        eventId:
          guestPass.eventId,

        registrationId:
          registration._id,

        type: "GUEST_PASS",

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

    /*
     * =====================================================
     * MEMBER EVENT QR
     * =====================================================
     */

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

      /*
       * Find event.
       */
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

      /*
       * Find member.
       */
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

      /*
       * ==========================================
       * CHECK IN MEMBER
       * ==========================================
       */

      const updateResult =
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

                updatedAt: now,
              },
            }
          );

      if (
        updateResult.modifiedCount !== 1
      ) {
        return NextResponse.json(
          {
            success: false,
            type: "EVENT",
            message:
              "This registration was already checked in.",
          },
          { status: 409 }
        );
      }

      /*
       * ==========================================
       * MEMBER ATTENDANCE
       * ==========================================
       */

      const attendance = {
        memberId:
          registration.memberId,

        eventId:
          registration.eventId,

        registrationId:
          registration._id,

        type: "EVENT",

        status: "PRESENT",

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

      /*
       * ==========================================
       * MEMBER RESPONSE
       * ==========================================
       */

      return NextResponse.json({
        success: true,

        type: "EVENT",

        message:
          "Member checked in successfully.",

        data: {
          attendanceId:
            attendanceResult.insertedId.toString(),

          registrationId:
            registration._id.toString(),

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

          /*
           * Tell scanner whether this
           * registration contains a guest.
           */
          guest: registration.guest?.enabled
            ? {
                enabled: true,

                name:
                  registration.guest.name ||
                  "",

                mobile:
                  registration.guest.mobile ||
                  "",

                guestPassId:
                  registration.guest.guestPassId
                    ?.toString() ||
                  null,

                status:
                  registration.guest.status ||
                  "RESERVED",
              }
            : {
                enabled: false,
              },

          checkedInAt: now,
        },
      });
    }

    /*
     * =====================================================
     * UNKNOWN QR
     * =====================================================
     */

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
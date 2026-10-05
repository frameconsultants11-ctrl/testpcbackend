import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { auth } from "@/lib/auth";
import { getDB } from "@/lib/db";

function generateEventQRCode() {
  return `ER-${Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase()}`;
}

export async function POST(request, { params }) {
  try {
    const session = await auth();

    /*
     * Future USER auth should contain:
     *
     * session.user.memberId
     */

    if (!session?.user?.memberId) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid event ID.",
        },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(session.user.memberId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid member ID.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const useGuestPass =
      body?.useGuestPass === true;

    const guestName =
      body?.guest?.name
        ?.toString()
        .trim() || "";

    const guestMobile =
      body?.guest?.mobile
        ?.toString()
        .trim() || "";

    const memberId = new ObjectId(
      session.user.memberId
    );

    const eventId = new ObjectId(id);

    const db = await getDB();

    /*
     * ==========================================
     * 1. FIND EVENT
     * ==========================================
     */

    const event =
      await db.collection("events").findOne({
        _id: eventId,
      });

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          message: "Event not found.",
        },
        { status: 404 }
      );
    }

    if (
      event.status !== "PUBLISHED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This event is not available for registration.",
        },
        { status: 400 }
      );
    }

    /*
     * ==========================================
     * 2. FIND MEMBER
     * ==========================================
     */

    const member =
      await db.collection("members").findOne({
        _id: memberId,
      });

    if (!member) {
      return NextResponse.json(
        {
          success: false,
          message: "Member not found.",
        },
        { status: 404 }
      );
    }

    /*
     * ==========================================
     * 3. CHECK EXISTING REGISTRATION
     * ==========================================
     */

    const existingRegistration =
      await db
        .collection("event_registrations")
        .findOne({
          eventId,
          memberId,
        });

    if (existingRegistration) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are already registered for this event.",
          registration: {
            _id:
              existingRegistration._id.toString(),
            qrCode:
              existingRegistration.qrCode,
            status:
              existingRegistration.status,
          },
        },
        { status: 409 }
      );
    }

    /*
     * ==========================================
     * 4. CHECK GUEST DETAILS
     * ==========================================
     */

    if (useGuestPass) {
      if (!guestName) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Guest name is required.",
          },
          { status: 400 }
        );
      }

      if (
        !/^[0-9]{10}$/.test(
          guestMobile
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Enter a valid 10 digit guest mobile number.",
          },
          { status: 400 }
        );
      }
    }

    /*
     * ==========================================
     * 5. FIND AVAILABLE FREE GUEST PASS
     * ==========================================
     */

    let guestPass = null;

    if (useGuestPass) {
      guestPass =
        await db
          .collection("guest_passes")
          .findOne({
            memberId,
            type: "FREE",
            status: "AVAILABLE",
          });

      if (!guestPass) {
        return NextResponse.json(
          {
            success: false,
            message:
              "You do not have an available free guest pass.",
          },
          { status: 400 }
        );
      }
    }

    /*
     * ==========================================
     * 6. CALCULATE EVENT CAPACITY
     * ==========================================
     *
     * Member registrations
     * +
     * Guest reservations
     *
     * = occupied seats
     */

    const memberRegistrationCount =
      await db
        .collection("event_registrations")
        .countDocuments({
          eventId,

          status: {
            $in: [
              "REGISTERED",
              "ATTENDED",
            ],
          },
        });

    const guestReservationCount =
      await db
        .collection("event_registrations")
        .countDocuments({
          eventId,

          "guest.enabled": true,

          "guest.status": "RESERVED",

          status: {
            $in: [
              "REGISTERED",
              "ATTENDED",
            ],
          },
        });

    /*
     * One member registration already
     * occupies one seat.
     *
     * If guest is selected, it occupies
     * one additional seat.
     */

    const seatsRequired =
      useGuestPass ? 2 : 1;

    const totalOccupied =
      memberRegistrationCount +
      guestReservationCount;

    const availableSeats =
      Math.max(
        Number(event.capacity || 0) -
          totalOccupied,
        0
      );

    if (
      availableSeats <
      seatsRequired
    ) {
      return NextResponse.json(
        {
          success: false,
          message: useGuestPass
            ? "There is not enough space for you and your guest."
            : "This event is full.",
          capacity:
            Number(event.capacity || 0),
          occupied: totalOccupied,
          available: availableSeats,
        },
        { status: 409 }
      );
    }

    /*
     * ==========================================
     * 7. GENERATE MEMBER QR
     * ==========================================
     */

    const qrCode =
      generateEventQRCode();

    /*
     * ==========================================
     * 8. CREATE REGISTRATION
     * ==========================================
     */

    const now = new Date();

    const registration = {
      eventId,

      memberId,

      status: "REGISTERED",

      qrCode,

      registeredAt: now,

      attendedAt: null,

      guest: {
        enabled: useGuestPass,

        guestPassId: useGuestPass
          ? guestPass._id
          : null,

        name: useGuestPass
          ? guestName
          : null,

        mobile: useGuestPass
          ? guestMobile
          : null,

        status: useGuestPass
          ? "RESERVED"
          : null,
      },

      createdAt: now,

      updatedAt: now,
    };

    const registrationResult =
      await db
        .collection("event_registrations")
        .insertOne(registration);

    /*
     * ==========================================
     * 9. RESERVE GUEST PASS
     * ==========================================
     */

    if (useGuestPass) {
      const guestUpdate =
        await db
          .collection("guest_passes")
          .updateOne(
            {
              _id: guestPass._id,

              memberId,

              type: "FREE",

              status: "AVAILABLE",
            },
            {
              $set: {
                status: "RESERVED",

                eventId,

                reservedAt: now,

                reservedBy: memberId,

                updatedAt: now,
              },
            }
          );

      /*
       * This should normally never fail.
       *
       * If another request consumed the pass
       * between our checks, we need to tell
       * the user that registration could not
       * be completed correctly.
       */

      if (
        guestUpdate.modifiedCount !== 1
      ) {
        /*
         * Remove the registration we just
         * created because the guest pass
         * could not be reserved.
         *
         * No transaction is used.
         */

        await db
          .collection("event_registrations")
          .deleteOne({
            _id:
              registrationResult.insertedId,
          });

        return NextResponse.json(
          {
            success: false,
            message:
              "Your guest pass is no longer available. Please try again.",
          },
          { status: 409 }
        );
      }
    }

    /*
     * ==========================================
     * 10. RESPONSE
     * ==========================================
     */

    return NextResponse.json(
      {
        success: true,

        message: useGuestPass
          ? "Event registration and guest reservation successful."
          : "Event registration successful.",

        registration: {
          _id:
            registrationResult.insertedId.toString(),

          eventId:
            eventId.toString(),

          memberId:
            memberId.toString(),

          status: "REGISTERED",

          qrCode,

          registeredAt: now,

          guest: {
            enabled: useGuestPass,

            guestPassId:
              useGuestPass
                ? guestPass._id.toString()
                : null,

            name: useGuestPass
              ? guestName
              : null,

            mobile: useGuestPass
              ? guestMobile
              : null,

            status: useGuestPass
              ? "RESERVED"
              : null,
          },
        },

        capacity: {
          total: Number(
            event.capacity || 0
          ),

          occupied:
            totalOccupied +
            seatsRequired,

          available:
            Math.max(
              availableSeats -
                seatsRequired,
              0
            ),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "EVENT REGISTRATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to register for event.",
      },
      { status: 500 }
    );
  }
}
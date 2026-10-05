import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { auth } from "@/lib/auth";
import { getDB } from "@/lib/db";

const ALLOWED_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "CANCELLED",
  "COMPLETED",
];

async function getEventStats(db, eventId) {
  const memberRegistrations =
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

  const guestReservations =
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

        "guest.enabled": true,

        "guest.status": {
          $in: [
            "RESERVED",
            "ATTENDED",
          ],
        },
      });

  const attendedMembers =
    await db
      .collection("attendance")
      .countDocuments({
        eventId,

        type: "EVENT",

        status: "PRESENT",
      });

  const attendedGuests =
    await db
      .collection("attendance")
      .countDocuments({
        eventId,

        type: "GUEST_PASS",

        status: "PRESENT",
      });

  const registeredCount =
    memberRegistrations +
    guestReservations;

  const attendedCount =
    attendedMembers +
    attendedGuests;

  return {
    memberRegistrations,

    guestReservations,

    registeredCount,

    availableCount: Math.max(
      Number(eventCapacityFallback || 0) -
        registeredCount,
      0
    ),

    attendedMembers,

    attendedGuests,

    attendedCount,
  };
}

/*
 * GET
 * /api/admin/events/[id]
 */
export async function GET(
  request,
  { params }
) {
  try {
    const session = await auth();

    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (
      !id ||
      !ObjectId.isValid(id)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid event ID.",
        },
        { status: 400 }
      );
    }

    const db = await getDB();

    const event =
      await db.collection("events").findOne({
        _id: new ObjectId(id),
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

    const eventId = event._id;

    const memberRegistrations =
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

    const guestReservations =
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

          "guest.enabled": true,

          "guest.status": {
            $in: [
              "RESERVED",
              "ATTENDED",
            ],
          },
        });

    const attendedMembers =
      await db
        .collection("attendance")
        .countDocuments({
          eventId,

          type: "EVENT",

          status: "PRESENT",
        });

    const attendedGuests =
      await db
        .collection("attendance")
        .countDocuments({
          eventId,

          type: "GUEST_PASS",

          status: "PRESENT",
        });

    const registeredCount =
      memberRegistrations +
      guestReservations;

    const attendedCount =
      attendedMembers +
      attendedGuests;

    const capacity = Number(
      event.capacity || 0
    );

    return NextResponse.json({
      success: true,

      event: {
        ...event,

        _id: event._id.toString(),

        createdBy:
          event.createdBy?.toString?.() ||
          null,

        capacity,

        memberRegistrations,

        guestReservations,

        registeredCount,

        availableCount: Math.max(
          capacity - registeredCount,
          0
        ),

        attendedMembers,

        attendedGuests,

        attendedCount,
      },
    });
  } catch (error) {
    console.error(
      "ADMIN EVENT GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch event.",
      },
      { status: 500 }
    );
  }
}

/*
 * PATCH
 * /api/admin/events/[id]
 */
export async function PATCH(
  request,
  { params }
) {
  try {
    const session = await auth();

    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (
      !id ||
      !ObjectId.isValid(id)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid event ID.",
        },
        { status: 400 }
      );
    }

    const db = await getDB();

    const eventId = new ObjectId(id);

    const existingEvent =
      await db.collection("events").findOne({
        _id: eventId,
      });

    if (!existingEvent) {
      return NextResponse.json(
        {
          success: false,
          message: "Event not found.",
        },
        { status: 404 }
      );
    }

    const body = await request.json();

    const update = {};

    if (body.name !== undefined) {
      const name =
        body.name
          ?.toString()
          .trim() || "";

      if (!name) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Event name cannot be empty.",
          },
          { status: 400 }
        );
      }

      update.name = name;
    }

    if (
      body.description !== undefined
    ) {
      update.description =
        body.description
          ?.toString()
          .trim() || "";
    }

    if (body.date !== undefined) {
      update.date =
        body.date
          ?.toString()
          .trim() || "";
    }

    if (
      body.startTime !== undefined
    ) {
      update.startTime =
        body.startTime
          ?.toString()
          .trim() || "";
    }

    if (
      body.endTime !== undefined
    ) {
      update.endTime =
        body.endTime
          ?.toString()
          .trim() || "";
    }

    if (
      body.location !== undefined
    ) {
      update.location =
        body.location
          ?.toString()
          .trim() || "";
    }

    /*
     * Capacity cannot be lower than
     * currently occupied seats.
     */
    if (body.capacity !== undefined) {
      const capacity = Number(
        body.capacity
      );

      if (
        !Number.isInteger(capacity) ||
        capacity <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Capacity must be a positive number.",
          },
          { status: 400 }
        );
      }

      const memberRegistrations =
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

      const guestReservations =
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

            "guest.enabled": true,

            "guest.status": {
              $in: [
                "RESERVED",
                "ATTENDED",
              ],
            },
          });

      const occupied =
        memberRegistrations +
        guestReservations;

      if (capacity < occupied) {
        return NextResponse.json(
          {
            success: false,

            message:
              `Capacity cannot be lower than current occupied seats (${occupied}).`,

            occupied,
          },
          { status: 400 }
        );
      }

      update.capacity = capacity;
    }

    if (body.status !== undefined) {
      if (
        !ALLOWED_STATUSES.includes(
          body.status
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid event status.",
          },
          { status: 400 }
        );
      }

      update.status = body.status;
    }

    update.updatedAt = new Date();

    await db
      .collection("events")
      .updateOne(
        {
          _id: eventId,
        },
        {
          $set: update,
        }
      );

    const updatedEvent =
      await db.collection("events").findOne({
        _id: eventId,
      });

    return NextResponse.json({
      success: true,

      message:
        "Event updated successfully.",

      event: {
        ...updatedEvent,

        _id:
          updatedEvent._id.toString(),

        createdBy:
          updatedEvent.createdBy
            ?.toString?.() || null,
      },
    });
  } catch (error) {
    console.error(
      "ADMIN EVENT UPDATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update event.",
      },
      { status: 500 }
    );
  }
}

/*
 * DELETE
 * /api/admin/events/[id]
 *
 * Soft delete = CANCELLED
 */
export async function DELETE(
  request,
  { params }
) {
  try {
    const session = await auth();

    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (
      !id ||
      !ObjectId.isValid(id)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid event ID.",
        },
        { status: 400 }
      );
    }

    const db = await getDB();

    const result =
      await db
        .collection("events")
        .updateOne(
          {
            _id: new ObjectId(id),
          },
          {
            $set: {
              status: "CANCELLED",

              updatedAt: new Date(),
            },
          }
        );

    if (
      result.matchedCount === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Event not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,

      message:
        "Event cancelled successfully.",
    });
  } catch (error) {
    console.error(
      "ADMIN EVENT DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to cancel event.",
      },
      { status: 500 }
    );
  }
}
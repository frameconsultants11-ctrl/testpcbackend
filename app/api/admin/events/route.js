import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { auth } from "@/lib/auth";
import { getDB } from "@/lib/db";

export async function GET(request) {
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

    const { searchParams } = new URL(request.url);

    const search =
      searchParams.get("search")?.trim() || "";

    const status =
      searchParams.get("status") || "ALL";

    const page = Math.max(
      Number(searchParams.get("page") || 1),
      1
    );

    const limit = Math.min(
      Math.max(
        Number(searchParams.get("limit") || 10),
        1
      ),
      100
    );

    const skip = (page - 1) * limit;

    const db = await getDB();

    const eventQuery = {};

    if (status !== "ALL") {
      eventQuery.status = status;
    }

    if (search) {
      eventQuery.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          location: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const events = await db
      .collection("events")
      .find(eventQuery)
      .sort({
        date: 1,
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db
      .collection("events")
      .countDocuments(eventQuery);

    /*
     * Calculate registration/guest counts
     * for every event.
     */
    const result = await Promise.all(
      events.map(async (event) => {
        const eventId = event._id;

        /*
         * Member registrations.
         *
         * One registration = one member seat.
         */
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

        /*
         * Guest reservations.
         *
         * One guest = one additional seat.
         */
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

        /*
         * Total seats occupied.
         */
        const registeredCount =
          memberRegistrations +
          guestReservations;

        const capacity = Number(
          event.capacity || 0
        );

        const availableCount = Math.max(
          capacity - registeredCount,
          0
        );

        /*
         * Member attendance.
         */
        const attendedMembers =
          await db
            .collection("attendance")
            .countDocuments({
              eventId,

              type: "EVENT",

              status: "PRESENT",
            });

        /*
         * Guest attendance.
         */
        const attendedGuests =
          await db
            .collection("attendance")
            .countDocuments({
              eventId,

              type: "GUEST_PASS",

              status: "PRESENT",
            });

        const attendedCount =
          attendedMembers +
          attendedGuests;

        return {
          ...event,

          _id: event._id.toString(),

          createdBy:
            event.createdBy?.toString?.() ||
            null,

          capacity,

          memberRegistrations,

          guestReservations,

          registeredCount,

          availableCount,

          attendedMembers,

          attendedGuests,

          attendedCount,
        };
      })
    );

    return NextResponse.json({
      success: true,

      events: result,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(
          total / limit
        ),
      },
    });
  } catch (error) {
    console.error(
      "ADMIN EVENTS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch events.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
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

    const body = await request.json();

    const name =
      body?.name?.toString().trim() || "";

    const description =
      body?.description
        ?.toString()
        .trim() || "";

    const date =
      body?.date?.toString().trim() || "";

    const startTime =
      body?.startTime
        ?.toString()
        .trim() || "";

    const endTime =
      body?.endTime
        ?.toString()
        .trim() || "";

    const location =
      body?.location
        ?.toString()
        .trim() || "";

    const capacity = Number(
      body?.capacity
    );

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Event name is required.",
        },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          message: "Event date is required.",
        },
        { status: 400 }
      );
    }

    if (!startTime) {
      return NextResponse.json(
        {
          success: false,
          message: "Start time is required.",
        },
        { status: 400 }
      );
    }

    if (!endTime) {
      return NextResponse.json(
        {
          success: false,
          message: "End time is required.",
        },
        { status: 400 }
      );
    }

    if (!location) {
      return NextResponse.json(
        {
          success: false,
          message: "Location is required.",
        },
        { status: 400 }
      );
    }

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

    const db = await getDB();

    const now = new Date();

    const event = {
      name,

      description,

      date,

      startTime,

      endTime,

      location,

      capacity,

      status: "DRAFT",

      createdBy: new ObjectId(
        session.user.id
      ),

      createdAt: now,

      updatedAt: now,
    };

    const result = await db
      .collection("events")
      .insertOne(event);

    return NextResponse.json(
      {
        success: true,

        message: "Event created successfully.",

        event: {
          ...event,

          _id: result.insertedId.toString(),

          createdBy:
            session.user.id,
        },

        /*
         * Counts are derived.
         */
        memberRegistrations: 0,
        guestReservations: 0,
        registeredCount: 0,
        availableCount: capacity,
        attendedCount: 0,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "ADMIN EVENT CREATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create event.",
      },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { getDB } from "@/lib/db";

export async function POST(request, { params }) {
  try {
    const session = await auth();

    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
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

    const body = await request.json();

    const qrCode = body?.qrCode?.toString().trim();

    if (!qrCode) {
      return NextResponse.json(
        {
          success: false,
          message: "QR code is required.",
        },
        { status: 400 }
      );
    }

    const db = await getDB();

    const eventId = new ObjectId(id);

    const event = await db.collection("events").findOne({
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

    if (event.status === "CANCELLED") {
      return NextResponse.json(
        {
          success: false,
          message: "This event has been cancelled.",
        },
        { status: 400 }
      );
    }

    const registration =
      await db.collection("event_registrations").findOne({
        eventId,
        qrCode,
      });

    if (!registration) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid event QR code.",
        },
        { status: 404 }
      );
    }

    if (registration.status === "ATTENDED") {
      return NextResponse.json(
        {
          success: false,
          message: "Member is already checked in.",
          registration: {
            _id: registration._id.toString(),
            attendedAt: registration.attendedAt,
          },
        },
        { status: 409 }
      );
    }

    if (registration.status !== "REGISTERED") {
      return NextResponse.json(
        {
          success: false,
          message: `Registration status is ${registration.status}.`,
        },
        { status: 400 }
      );
    }

    const member = await db.collection("members").findOne({
      _id: registration.memberId,
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

    const now = new Date();

    const updateResult = await db
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

    if (updateResult.modifiedCount !== 1) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to check in. Registration may have already been used.",
        },
        { status: 409 }
      );
    }

    const attendance = {
      memberId: registration.memberId,
      eventId,
      registrationId: registration._id,

      type: "EVENT",
      status: "PRESENT",

      checkedInAt: now,
      checkedInBy: new ObjectId(session.user.id),

      createdAt: now,
      updatedAt: now,
    };

    const attendanceResult =
      await db.collection("attendance").insertOne(attendance);

    return NextResponse.json({
      success: true,
      message: "Member checked in successfully.",

      registration: {
        _id: registration._id.toString(),
        eventId: registration.eventId.toString(),
        memberId: registration.memberId.toString(),
        status: "ATTENDED",
        qrCode: registration.qrCode,
        registeredAt: registration.registeredAt,
        attendedAt: now,
      },

      member: {
        _id: member._id.toString(),
        name: member.name || "",
        email: member.email || "",
        mobile: member.mobile || "",
      },

      attendance: {
        _id: attendanceResult.insertedId.toString(),
        checkedInAt: now,
      },
    });
  } catch (error) {
    console.error(
      "ADMIN EVENT CHECK-IN ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to check in member.",
      },
      { status: 500 }
    );
  }
}
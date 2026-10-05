import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { getDB } from "@/lib/db";

export async function POST(request) {
  try {
    // -----------------------------
    // 1. Check admin authentication
    // -----------------------------
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // -----------------------------
    // 2. Read request body
    // -----------------------------
    const body = await request.json();

    const code = body?.code?.trim();
    const guestName = body?.guest?.name?.trim();
    const guestMobile = body?.guest?.mobile?.trim();

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          message: "Guest pass code is required.",
        },
        { status: 400 }
      );
    }

    if (!guestName) {
      return NextResponse.json(
        {
          success: false,
          message: "Guest name is required.",
        },
        { status: 400 }
      );
    }

    if (!guestMobile) {
      return NextResponse.json(
        {
          success: false,
          message: "Guest mobile number is required.",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // 3. Validate mobile
    // -----------------------------
    if (!/^[0-9]{10}$/.test(guestMobile)) {
      return NextResponse.json(
        {
          success: false,
          message: "Guest mobile number must be exactly 10 digits.",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // 4. Connect DB
    // -----------------------------
    const db = await getDB();

    const guestPasses = db.collection("guest_passes");
    const members = db.collection("members");
    const attendance = db.collection("attendance");

    // -----------------------------
    // 5. Find guest pass
    // -----------------------------
    const guestPass = await guestPasses.findOne({
      code: code.toUpperCase(),
    });

    if (!guestPass) {
      return NextResponse.json(
        {
          success: false,
          message: "Guest pass not found.",
        },
        { status: 404 }
      );
    }

    // -----------------------------
    // 6. Check pass type
    // -----------------------------
    if (guestPass.type !== "FREE") {
      return NextResponse.json(
        {
          success: false,
          message: "This is not a valid free guest pass.",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // 7. Check pass status
    // -----------------------------
    if (guestPass.status !== "AVAILABLE") {
      return NextResponse.json(
        {
          success: false,
          message: "This guest pass has already been used.",
        },
        { status: 409 }
      );
    }

    // -----------------------------
    // 8. Find member
    // -----------------------------
    const member = await members.findOne({
      _id: guestPass.memberId,
    });

    if (!member) {
      return NextResponse.json(
        {
          success: false,
          message: "Member associated with this guest pass was not found.",
        },
        { status: 404 }
      );
    }

    // -----------------------------
    // 9. Mark guest pass as USED
    // -----------------------------
    const now = new Date();

    const updateResult = await guestPasses.updateOne(
      {
        _id: guestPass._id,
      },
      {
        $set: {
          status: "USED",
          usedAt: now,
          updatedAt: now,

          // Admin who processed the guest pass
          usedBy: new ObjectId(session.user.id),
        },
      }
    );

    if (updateResult.modifiedCount !== 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Unable to update guest pass.",
        },
        { status: 500 }
      );
    }

    // -----------------------------
    // 10. Create attendance record
    // -----------------------------
    const attendanceRecord = {
      memberId: guestPass.memberId,

      type: "GUEST_PASS",

      guestPassId: guestPass._id,
      guestPassCode: guestPass.code,

      status: "PRESENT",

      guest: {
        name: guestName,
        mobile: guestMobile,
      },

      checkedInAt: now,
      checkedInBy: new ObjectId(session.user.id),

      createdAt: now,
      updatedAt: now,
    };

    const attendanceResult = await attendance.insertOne(
      attendanceRecord
    );

    // -----------------------------
    // 11. Return success
    // -----------------------------
    return NextResponse.json(
      {
        success: true,
        message: "Guest checked in successfully.",

        guestPass: {
          _id: guestPass._id.toString(),
          code: guestPass.code,
          status: "USED",
          usedAt: now,
        },

        guest: {
          name: guestName,
          mobile: guestMobile,
        },

        member: {
          _id: member._id.toString(),
          name: member.name,
          email: member.email,
          mobile: member.mobile,
        },

        attendance: {
          _id: attendanceResult.insertedId.toString(),
          type: "GUEST_PASS",
          status: "PRESENT",
          checkedInAt: now,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GUEST PASS REDEEM ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to complete guest check-in.",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}
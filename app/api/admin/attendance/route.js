import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDB } from "@/lib/db";

export async function GET(request) {
  try {
    // ==========================================
    // AUTH
    // ==========================================

    const session = await auth();

    if (
      !session?.user ||
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // ==========================================
    // QUERY
    // ==========================================

    const { searchParams } =
      new URL(request.url);

    const search =
      searchParams.get("search")
        ?.trim()
        .toLowerCase() || "";

    const type =
      searchParams.get("type") || "ALL";

    const status =
      searchParams.get("status") || "ALL";

    const page = Math.max(
      Number(searchParams.get("page")) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number(searchParams.get("limit")) || 20,
        1
      ),
      100
    );

    const skip = (page - 1) * limit;

    // ==========================================
    // DATABASE
    // ==========================================

    const db = await getDB();

    // ==========================================
    // BASE QUERY
    // ==========================================

    const match = {};

    if (type !== "ALL") {
      match.type = type;
    }

    if (status !== "ALL") {
      match.status = status;
    }

    // ==========================================
    // AGGREGATION
    // ==========================================

    const pipeline = [
      {
        $match: match,
      },

      // ========================================
      // MEMBER
      // ========================================

      {
        $lookup: {
          from: "members",
          localField: "memberId",
          foreignField: "_id",
          as: "member",
        },
      },

      {
        $unwind: {
          path: "$member",
          preserveNullAndEmptyArrays: true,
        },
      },

      // ========================================
      // EVENT
      // ========================================

      {
        $lookup: {
          from: "events",
          localField: "eventId",
          foreignField: "_id",
          as: "event",
        },
      },

      {
        $unwind: {
          path: "$event",
          preserveNullAndEmptyArrays: true,
        },
      },

      // ========================================
      // SORT
      // ========================================

      {
        $sort: {
          checkedInAt: -1,
        },
      },
    ];

    // ==========================================
    // SEARCH
    // ==========================================

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            // Member
            {
              "member.name": {
                $regex: search,
                $options: "i",
              },
            },

            {
              "member.email": {
                $regex: search,
                $options: "i",
              },
            },

            {
              "member.mobile": {
                $regex: search,
                $options: "i",
              },
            },

            // Guest
            {
              "guest.name": {
                $regex: search,
                $options: "i",
              },
            },

            {
              "guest.mobile": {
                $regex: search,
                $options: "i",
              },
            },

            {
              guestPassCode: {
                $regex: search,
                $options: "i",
              },
            },

            // Event
            {
              "event.name": {
                $regex: search,
                $options: "i",
              },
            },

            {
              "event.location": {
                $regex: search,
                $options: "i",
              },
            },
          ],
        },
      });
    }

    // ==========================================
    // TOTAL
    // ==========================================

    const countPipeline = [
      ...pipeline,
      {
        $count: "total",
      },
    ];

    const countResult =
      await db
        .collection("attendance")
        .aggregate(countPipeline)
        .toArray();

    const total =
      countResult[0]?.total || 0;

    // ==========================================
    // PAGINATION
    // ==========================================

    pipeline.push(
      {
        $skip: skip,
      },
      {
        $limit: limit,
      }
    );

    // ==========================================
    // GET ATTENDANCE
    // ==========================================

    const attendance =
      await db
        .collection("attendance")
        .aggregate(pipeline)
        .toArray();

    // ==========================================
    // RESPONSE
    // ==========================================

    return NextResponse.json({
      success: true,

      attendance: attendance.map((item) => ({
        ...item,

        // ======================================
        // IDS
        // ======================================

        _id: item._id.toString(),

        memberId: item.memberId
          ? item.memberId.toString()
          : null,

        eventId: item.eventId
          ? item.eventId.toString()
          : null,

        registrationId:
          item.registrationId
            ? item.registrationId.toString()
            : null,

        guestPassId:
          item.guestPassId
            ? item.guestPassId.toString()
            : null,

        checkedInBy:
          item.checkedInBy
            ? item.checkedInBy.toString()
            : null,

        // ======================================
        // ATTENDANCE TYPE
        // ======================================

        attendanceType:
          item.type === "GUEST_PASS"
            ? "GUEST"
            : "MEMBER",

        // ======================================
        // MEMBER
        // ======================================

        member: item.member
          ? {
              _id:
                item.member._id.toString(),

              name:
                item.member.name || null,

              email:
                item.member.email || null,

              mobile:
                item.member.mobile || null,

              referralCode:
                item.member.referralCode ||
                null,
            }
          : null,

        // ======================================
        // GUEST
        // ======================================

        guest:
          item.guest
            ? {
                name:
                  item.guest.name || null,

                mobile:
                  item.guest.mobile || null,
              }
            : null,

        // ======================================
        // EVENT
        // ======================================

        event: item.event
          ? {
              _id:
                item.event._id.toString(),

              name:
                item.event.name || null,

              date:
                item.event.date || null,

              startTime:
                item.event.startTime || null,

              endTime:
                item.event.endTime || null,

              location:
                item.event.location || null,

              status:
                item.event.status || null,
            }
          : null,

        // ======================================
        // GUEST PASS
        // ======================================

        guestPassCode:
          item.guestPassCode || null,
      })),

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
      "GET ATTENDANCE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch attendance.",
      },
      { status: 500 }
    );
  }
}
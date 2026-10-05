import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { auth } from "@/lib/auth";
import { getDB } from "@/lib/db";


export async function GET(request) {
  try {
    const session = await auth();
const db = await getDB();
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

    const { searchParams } =
      new URL(request.url);

    const memberId =
      searchParams.get("memberId");

    const search =
      searchParams.get("search")?.trim() || "";

    const status =
      searchParams.get("status") || "ALL";

    const page = Math.max(
      Number(
        searchParams.get("page")
      ) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number(
          searchParams.get("limit")
        ) || 20,
        1
      ),
      100
    );

    const skip =
      (page - 1) * limit;

    /*
     * ========================================
     * VALIDATE MEMBER ID
     * ========================================
     */

    if (
      memberId &&
      !ObjectId.isValid(memberId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid member ID",
        },
        { status: 400 }
      );
    }

    /*
     * ========================================
     * BASE MATCH
     * ========================================
     */

    const match = {};

    if (memberId) {
      match.memberId =
        new ObjectId(memberId);
    }

    if (status !== "ALL") {
      match.status = status;
    }

    /*
     * ========================================
     * AGGREGATION
     * ========================================
     */

    const pipeline = [
      {
        $match: match,
      },

      /*
       * Join member information
       */
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
    ];

    /*
     * ========================================
     * SEARCH
     * ========================================
     */

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            {
              code: {
                $regex: search,
                $options: "i",
              },
            },

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
          ],
        },
      });
    }

    /*
     * ========================================
     * TOTAL COUNT
     * ========================================
     */

    const countResult =
      await db
        .collection("guest_passes")
        .aggregate([
          ...pipeline,

          {
            $count: "total",
          },
        ])
        .toArray();

    const total =
      countResult[0]?.total || 0;

    /*
     * ========================================
     * FETCH PASSES
     * ========================================
     */

    const passes =
      await db
        .collection("guest_passes")
        .aggregate([
          ...pipeline,

          {
            $sort: {
              createdAt: -1,
            },
          },

          {
            $skip: skip,
          },

          {
            $limit: limit,
          },

          /*
           * Only return fields
           * needed by admin UI.
           */
          {
            $project: {
              _id: 1,

              memberId: 1,

              type: 1,

              code: 1,

              status: 1,

              usedAt: 1,

              usedBy: 1,

              createdAt: 1,

              updatedAt: 1,

              memberName:
                "$member.name",

              memberEmail:
                "$member.email",

              memberMobile:
                "$member.mobile",
            },
          },
        ])
        .toArray();

    /*
     * ========================================
     * RESPONSE
     * ========================================
     */

    return NextResponse.json({
      success: true,

      passes: passes.map(
        (pass) => ({
          ...pass,

          _id:
            pass._id.toString(),

          memberId:
            pass.memberId.toString(),

          usedBy:
            pass.usedBy
              ? pass.usedBy.toString()
              : null,
        })
      ),

      pagination: {
        page,

        limit,

        total,

        totalPages:
          Math.ceil(
            total / limit
          ),
      },
    });
  } catch (error) {
    console.error(
      "GET GUEST PASSES ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch guest passes",
      },
      { status: 500 }
    );
  }
}

/*
 * ==========================================
 * CREATE GUEST PASS
 * ==========================================
 *
 * Currently creates ONLY the
 * one-time FREE guest pass.
 */

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
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const body =
      await request.json();

    const memberId =
      body.memberId;

    /*
     * ========================================
     * VALIDATE MEMBER ID
     * ========================================
     */

    if (!memberId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Member is required",
        },
        { status: 400 }
      );
    }

    if (
      !ObjectId.isValid(memberId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid member ID",
        },
        { status: 400 }
      );
    }

    const db = await getDB();

    const memberObjectId =
      new ObjectId(memberId);

    /*
     * ========================================
     * CHECK MEMBER
     * ========================================
     */

    const member =
      await db
        .collection("members")
        .findOne({
          _id: memberObjectId,
        });

    if (!member) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Member not found",
        },
        { status: 404 }
      );
    }

    /*
     * ========================================
     * CHECK FREE PASS
     * ========================================
     *
     * A member can receive their
     * FREE pass only once.
     */

    const existingFreePass =
      await db
        .collection("guest_passes")
        .findOne({
          memberId:
            memberObjectId,

          type: "FREE",
        });

    if (existingFreePass) {
      return NextResponse.json(
        {
          success: false,

          message:
            "This member has already received their free guest pass.",
        },
        { status: 409 }
      );
    }

    /*
     * ========================================
     * GENERATE CODE
     * ========================================
     */

    const code =
      `GP-${Date.now()
        .toString(36)
        .toUpperCase()}-${Math.random()
        .toString(36)
        .substring(2, 7)
        .toUpperCase()}`;

    const now =
      new Date();

    /*
     * ========================================
     * GUEST PASS
     * ========================================
     */

    const guestPass = {
      memberId:
        memberObjectId,

      type: "FREE",

      code,

      status: "AVAILABLE",

      usedAt: null,

      usedBy: null,

      createdAt: now,

      updatedAt: now,
    };

    /*
     * ========================================
     * INSERT
     * ========================================
     */

    const result =
      await db
        .collection("guest_passes")
        .insertOne(
          guestPass
        );

    /*
     * ========================================
     * RESPONSE
     * ========================================
     */

    return NextResponse.json(
      {
        success: true,

        message:
          "Free guest pass created successfully.",

        guestPass: {
          ...guestPass,

          _id:
            result.insertedId.toString(),

          memberId:
            guestPass.memberId.toString(),
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE GUEST PASS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Failed to create guest pass",
      },
      {
        status: 500,
      }
    );
  }
}
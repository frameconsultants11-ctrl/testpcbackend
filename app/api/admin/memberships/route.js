import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDB } from "@/lib/db";
import { ObjectId } from "mongodb";
export async function GET(request) {
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

    const { searchParams } = new URL(request.url);

    const search =
      searchParams.get("search")?.trim() || "";

    const status =
      searchParams.get("status") || "all";

    const page = Math.max(
      parseInt(
        searchParams.get("page") || "1",
        10
      ),
      1
    );

    const limit = Math.min(
      Math.max(
        parseInt(
          searchParams.get("limit") || "20",
          10
        ),
        1
      ),
      100
    );

    const skip = (page - 1) * limit;

    const db = await getDB();

    const memberships =
      db.collection("memberships");

    const members =
      db.collection("members");

    const query = {};

    if (status !== "all") {
      query.status = status.toUpperCase();
    }

    /*
     * Find memberships first
     */
    const membershipList =
      await memberships
        .find(query)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .toArray();

    /*
     * Get related members
     */
    const memberIds =
      membershipList.map(
        (membership) =>
          membership.memberId
      );

    const memberList =
      await members
        .find({
          _id: {
            $in: memberIds,
          },
        })
        .project({
          name: 1,
          email: 1,
          mobile: 1,
          referralCode: 1,
        })
        .toArray();

    const memberMap =
      new Map(
        memberList.map((member) => [
          member._id.toString(),
          member,
        ])
      );

    let results =
      membershipList.map(
        (membership) => {
          const member =
            memberMap.get(
              membership.memberId?.toString()
            );

          return {
            ...membership,

            _id:
              membership._id.toString(),

            memberId:
              membership.memberId?.toString(),

            member: member
              ? {
                  ...member,
                  _id:
                    member._id.toString(),
                }
              : null,
          };
        }
      );

    /*
     * Search member details
     */
    if (search) {
      const regex =
        new RegExp(search, "i");

      results = results.filter(
        (item) =>
          regex.test(
            item.member?.name || ""
          ) ||
          regex.test(
            item.member?.email || ""
          ) ||
          regex.test(
            item.member?.mobile || ""
          ) ||
          regex.test(
            item.plan || ""
          )
      );
    }

    /*
     * Total memberships
     */
    const total =
      await memberships.countDocuments(
        query
      );

    return NextResponse.json({
      success: true,

      memberships: results,

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
      "ADMIN MEMBERSHIPS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch memberships",
      },
      {
        status: 500,
      }
    );
  }
} 
const MEMBERSHIP_AMOUNT = 1499;

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

    const body = await request.json();

    const memberId = body.memberId;

    if (!memberId) {
      return NextResponse.json(
        {
          success: false,
          message: "Member is required",
        },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(memberId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid member ID",
        },
        { status: 400 }
      );
    }

    const db = await getDB();

    const members =
      db.collection("members");

    const memberships =
      db.collection("memberships");

    const memberObjectId =
      new ObjectId(memberId);

    // Check member exists
    const member =
      await members.findOne({
        _id: memberObjectId,
      });

    if (!member) {
      return NextResponse.json(
        {
          success: false,
          message: "Member not found",
        },
        { status: 404 }
      );
    }

    // Prevent duplicate active membership
    const activeMembership =
      await memberships.findOne({
        memberId: memberObjectId,
        status: "ACTIVE",
      });

    if (activeMembership) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Member already has an active membership",
        },
        { status: 409 }
      );
    }

    const now = new Date();

    const membership = {
      memberId: memberObjectId,

      plan: "PURPLE_MEMBERSHIP",

      amount: MEMBERSHIP_AMOUNT,

      status: "ACTIVE",

      startDate: now,

      endDate: null,

      sundayExperiences: {
        total: 4,
        used: 0,
      },

      bodyAssessment: {
        included: true,
        completed: false,
        completedAt: null,
      },

      purpleKit: {
        included: true,
        tshirt: false,
        shaker: false,
      },

      createdAt: now,
      updatedAt: now,
    };

    const result =
      await memberships.insertOne(
        membership
      );

    return NextResponse.json(
      {
        success: true,
        message:
          "Membership created successfully",

        membership: {
          ...membership,
          _id: result.insertedId.toString(),
          memberId:
            membership.memberId.toString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "CREATE MEMBERSHIP ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create membership",
      },
      { status: 500 }
    );
  }
}
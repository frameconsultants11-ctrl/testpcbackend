import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { auth } from "@/lib/auth";
import { getDB } from "@/lib/db";

export async function GET(request, { params }) {
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

    const { id } = await params;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid member ID",
        },
        { status: 400 }
      );
    }

    const db = await getDB();

    const memberId = new ObjectId(id);

    const member = await db
      .collection("members")
      .findOne({
        _id: memberId,
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

    /*
     * Get active membership
     */
    const membership = await db
      .collection("memberships")
      .findOne(
        {
          memberId,
          status: "ACTIVE",
        },
        {
          sort: {
            createdAt: -1,
          },
        }
      );

    /*
     * Get referral information
     */
    const referralCount = await db
      .collection("referrals")
      .countDocuments({
        referrerId: memberId,
        status: "MEMBERSHIP_PURCHASED",
      });

    /*
     * Get guest passes
     */
    const guestPasses = await db
      .collection("guest_passes")
      .find({
        memberId,
      })
      .sort({
        createdAt: -1,
      })
      .toArray();

    /*
     * Get attendance
     */
    const attendanceCount = await db
      .collection("attendance")
      .countDocuments({
        memberId,
      });

    /*
     * Get payments
     */
    const payments = await db
      .collection("payments")
      .find({
        memberId,
      })
      .sort({
        createdAt: -1,
      })
      .limit(20)
      .toArray();

    return NextResponse.json({
      success: true,

      member: {
        ...member,

        _id: member._id.toString(),

        referredBy:
          member.referredBy
            ? member.referredBy.toString()
            : null,
      },

      membership: membership
        ? {
            ...membership,

            _id: membership._id.toString(),

            memberId:
              membership.memberId.toString(),
          }
        : null,

      stats: {
        referralCount,
        attendanceCount,
        guestPassCount:
          guestPasses.length,
      },

      guestPasses: guestPasses.map(
        (pass) => ({
          ...pass,
          _id: pass._id.toString(),
          memberId:
            pass.memberId.toString(),
        })
      ),

      payments: payments.map(
        (payment) => ({
          ...payment,
          _id: payment._id.toString(),
          memberId:
            payment.memberId.toString(),
        })
      ),
    });
  } catch (error) {
    console.error(
      "GET MEMBER DETAILS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch member details",
      },
      { status: 500 }
    );
  }
}
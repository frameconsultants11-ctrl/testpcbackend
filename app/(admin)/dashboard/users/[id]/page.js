import { ObjectId } from "mongodb";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { getDB } from "@/lib/db";
import MemberDetailsClient from "@/components/admin/MemberDetailsClient";

export default async function MemberDetailsPage({
  params,
}) {
  const session = await auth();

  if (
    !session?.user ||
    session.user.role !== "ADMIN"
  ) {
    notFound();
  }

  const { id } = await params;

  if (!id || !ObjectId.isValid(id)) {
    notFound();
  }

  const db = await getDB();

  const member = await db
    .collection("members")
    .findOne({
      _id: new ObjectId(id),
    });

  if (!member) {
    notFound();
  }

  const membership = await db
    .collection("memberships")
    .findOne(
      {
        memberId: new ObjectId(id),
      },
      {
        sort: {
          createdAt: -1,
        },
      }
    );

  const referralCount =
    await db
      .collection("referrals")
      .countDocuments({
        referrerId: new ObjectId(id),
        status: "MEMBERSHIP_PURCHASED",
      });

  const attendanceCount =
    await db
      .collection("attendance")
      .countDocuments({
        memberId: new ObjectId(id),
      });

  const guestPassCount =
    await db
      .collection("guest_passes")
      .countDocuments({
        memberId: new ObjectId(id),
      });

  const data = {
    member: {
      ...member,
      _id: member._id.toString(),
      referredBy:
        member.referredBy?.toString() || null,
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
      guestPassCount,
    },
  };

  return (
    <MemberDetailsClient data={data} />
  );
}